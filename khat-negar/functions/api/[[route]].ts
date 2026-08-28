// Cloudflare Pages Functions — Central API Handler
// Routes all /api/* requests on Cloudflare's edge, backed by Supabase Postgres.
//
// This replaces the earlier placeholder. It covers the full end-user flow:
// health check, login/logout/session, typography options, and prompt
// generation (generate + generate-again). The admin panel (/api/admin/*)
// is not ported yet — it responds with a clear "not implemented" message
// instead of silently pretending to succeed.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface EventContext<Env, P extends string, Data> {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Env;
  params: Record<P, string | string[]>;
  data: Data;
}

export type PagesFunction<Env = unknown, P extends string = string, Data extends Record<string, unknown> = Record<string, unknown>> = (
  context: EventContext<Env, P, Data>
) => Response | Promise<Response>;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

function json(data: any, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders
    }
  });
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isValidHex(v: unknown): v is string {
  return typeof v === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v);
}

function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
}

function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get('Cookie') || '';
  const out: Record<string, string> = {};
  header.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function getToken(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7).trim();
  const cookies = parseCookies(request);
  return cookies['auth_token'] || null;
}

function authCookieHeader(token: string | null): string {
  if (token) {
    const maxAge = 365 * 24 * 60 * 60;
    return `auth_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
  }
  return `auth_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

// Very small best-effort in-memory rate limiter. Persists only while this
// Worker isolate stays warm — it is a light speed bump, not a guarantee.
// For solid protection, also add a Cloudflare "Rate limiting rule" in the
// dashboard (Security > WAF > Rate limiting rules) on /api/auth/login.
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (bucket.count >= limit) return true;
  bucket.count += 1;
  return false;
}

async function enrichUser(supabase: SupabaseClient, u: any) {
  const [{ data: logs }, { data: sessions }] = await Promise.all([
    supabase.from('login_logs').select('ip_address').eq('user_id', u.id).eq('success', true),
    supabase.from('sessions').select('id, expires_at').eq('user_id', u.id)
  ]);
  const uniqueIps = new Set((logs || []).map((l: any) => l.ip_address));
  const active = (sessions || []).filter((s: any) => new Date(s.expires_at) > new Date());
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    is_active: u.is_active,
    created_at: u.created_at,
    updated_at: u.updated_at,
    last_login_at: u.last_login_at || undefined,
    ip_count: uniqueIps.size,
    active_sessions_count: active.length,
    is_suspicious: u.is_suspicious || false
  };
}

async function getCurrentUser(supabase: SupabaseClient, request: Request) {
  const token = getToken(request);
  if (!token) return { user: null as any, token: null as string | null };

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!session) return { user: null as any, token };

  const now = new Date();
  if (new Date(session.expires_at) <= now) {
    await supabase.from('sessions').delete().eq('token', token);
    return { user: null as any, token };
  }

  // Rolling session: extend if less than 60 days remain
  const daysLeft = (new Date(session.expires_at).getTime() - now.getTime()) / 86_400_000;
  if (daysLeft < 60) {
    const newExpiry = new Date(now.getTime() + 365 * 86_400_000).toISOString();
    await supabase.from('sessions').update({ expires_at: newExpiry }).eq('token', token);
  }

  const { data: storedUser } = await supabase.from('users').select('*').eq('id', session.user_id).maybeSingle();
  if (!storedUser) return { user: null as any, token };

  const user = await enrichUser(supabase, storedUser);
  return { user, token };
}

async function getSettingsMap(supabase: SupabaseClient): Promise<Record<string, string>> {
  const { data } = await supabase.from('app_settings').select('key, value');
  const map: Record<string, string> = {};
  (data || []).forEach((row: any) => { map[row.key] = row.value; });
  return map;
}

// ---------------------------------------------------------------------------
// Prompt engine (ported from server/promptEngine.ts — same logic, Supabase-backed lookups)
// ---------------------------------------------------------------------------

function renderTemplate(template: string, map: Record<string, string>): string {
  let rendered = template;
  for (const [placeholder, value] of Object.entries(map)) {
    rendered = rendered.split(placeholder).join(value);
  }
  return rendered;
}

async function buildVariableMap(supabase: SupabaseClient, config: any): Promise<Record<string, string>> {
  const byId = async (table: string, id: string) => {
    if (!id) return null;
    const { data } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
    return data;
  };
  const firstActive = async (table: string) => {
    const { data } = await supabase.from(table).select('*').eq('active', true).order('sort_order').limit(1);
    return data && data[0] ? data[0] : null;
  };

  const [style, form, material, dimension, lighting, shadow, aspectRatio, aiModel] = await Promise.all([
    byId('typography_styles', config.calligraphyStyleId).then(v => v || firstActive('typography_styles')),
    byId('typography_forms', config.typographyFormId).then(v => v || firstActive('typography_forms')),
    byId('materials', config.materialId).then(v => v || firstActive('materials')),
    byId('dimension_options', config.dimensionId).then(v => v || firstActive('dimension_options')),
    byId('lighting_options', config.lightingId).then(v => v || firstActive('lighting_options')),
    byId('shadow_options', config.shadowingId).then(v => v || firstActive('shadow_options')),
    byId('aspect_ratio_options', config.aspectRatioId).then(v => v || firstActive('aspect_ratio_options')),
    byId('ai_models', config.aiModelId).then(v => v || firstActive('ai_models'))
  ]);

  const styleAiDesc = style
    ? `${style.name_fa} (${style.category === 'traditional' ? 'Traditional Persian Calligraphy' : 'Artistic Persian Typography'}): ${style.ai_description_en}`
    : 'Authentic high-contrast Persian Calligraphic Typography with balanced stroke rhythm and classical letter proportions';

  const formAiInstruction = form ? `${form.name_fa}: ${form.ai_instruction_en}` : 'Natural organic Persian typography composition';

  let backgroundStatus = 'No background / Isolated graphic typography presentation';
  let backgroundColorHex = 'Transparent background (if supported by target AI model) / Clean isolated canvas with zero accidental background environment';
  if (config.backgroundStatus === 'has_background') {
    backgroundStatus = 'Enabled solid custom colored background canvas';
    backgroundColorHex = String(config.backgroundColorHex).toUpperCase();
  }

  const materialDesc = material ? `${material.name_fa} - ${material.ai_description_en}` : 'Traditional rich calligraphic ink';
  const dimensionDesc = dimension ? `${dimension.name_fa} - ${dimension.ai_description_en}` : 'Flat 2D graphic typography';
  const lightingDesc = lighting ? `${lighting.name_fa} - ${lighting.ai_description_en}` : 'Soft even studio ambient lighting';
  const shadowDesc = shadow ? `${shadow.name_fa} - ${shadow.ai_description_en}` : 'No shadow';
  const aspectRatioValue = aspectRatio ? aspectRatio.value : '1:1';
  const aiModelName = aiModel ? aiModel.ai_name_en : 'Generic Flagship Image Generator';

  return {
    '{{TITLE}}': config.title,
    '{{CALLIGRAPHY_STYLE}}': styleAiDesc,
    '{{TYPOGRAPHY_FORM}}': formAiInstruction,
    '{{TITLE_COLOR_HEX}}': String(config.titleColorHex).toUpperCase(),
    '{{BACKGROUND_STATUS}}': backgroundStatus,
    '{{BACKGROUND_COLOR_HEX}}': backgroundColorHex,
    '{{MATERIAL}}': materialDesc,
    '{{DIMENSION}}': dimensionDesc,
    '{{LIGHTING}}': lightingDesc,
    '{{SHADOWING}}': shadowDesc,
    '{{ASPECT_RATIO}}': aspectRatioValue,
    '{{AI_MODEL}}': aiModelName
  };
}

function validateUserInput(config: any): { isValid: boolean; error?: string } {
  if (!config.title || typeof config.title !== 'string' || !config.title.trim()) {
    return { isValid: false, error: 'عنوان و متن تایپوگرافی الزامی است.' };
  }
  if (!isValidHex(config.titleColorHex)) {
    return { isValid: false, error: 'کد رنگ تایپوگرافی نامعتبر است (باید فرمت HEX معتبر باشد).' };
  }
  if (config.backgroundStatus === 'has_background' && !isValidHex(config.backgroundColorHex)) {
    return { isValid: false, error: 'کد رنگ پس‌زمینه نامعتبر است (باید فرمت HEX معتبر باشد).' };
  }
  return { isValid: true };
}

async function generatePrompt(supabase: SupabaseClient, config: any, opts: { currentMasterPromptIndex?: number; isGenerateAgain?: boolean }) {
  const validation = validateUserInput(config);
  if (!validation.isValid) throw new Error(validation.error);

  const { data: activePrompts } = await supabase
    .from('master_prompts')
    .select('*')
    .eq('active', true)
    .order('sort_order');

  if (!activePrompts || activePrompts.length === 0) {
    throw new Error('در حال حاضر هیچ پرامپت مادری برای تولید فعال نیست.');
  }

  const settings = await getSettingsMap(supabase);
  let nextIndex = 0;
  let cycleCompleted = false;

  if (opts.isGenerateAgain && opts.currentMasterPromptIndex !== undefined) {
    nextIndex = opts.currentMasterPromptIndex + 1;
    if (nextIndex >= activePrompts.length) {
      if (settings.allow_prompt_cycling === 'true') {
        nextIndex = 0;
        cycleCompleted = true;
      } else {
        nextIndex = activePrompts.length - 1;
        cycleCompleted = true;
      }
    }
  }

  const selected = activePrompts[nextIndex];
  const variableMap = await buildVariableMap(supabase, config);
  const prompt = renderTemplate(selected.template, variableMap);

  return { prompt, masterPrompt: selected, masterPromptIndex: nextIndex, totalActive: activePrompts.length, cycleCompleted };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (pathname === '/api/health') {
    return json({ status: 'ok', runtime: 'Cloudflare Pages Edge', time: new Date().toISOString() });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ success: false, error: 'متغیرهای محیطی Supabase تنظیم نشده‌اند (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' }, 500);
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const ip = getClientIp(request);
  const userAgent = request.headers.get('User-Agent') || '';

  let body: any = null;
  if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    try { body = await request.json(); } catch { body = {}; }
  }

  try {
    // ---------------- AUTH ----------------
    if (pathname === '/api/auth/login' && method === 'POST') {
      if (rateLimited(`login:${ip}`, 10, 5 * 60 * 1000)) {
        return json({ success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند دقیقه دیگر دوباره تلاش کنید.' }, 429);
      }
      const { username, password } = body || {};
      if (!username || !password) {
        return json({ success: false, error: 'نام کاربری و رمز عبور الزامی است.' }, 400);
      }

      const { data: storedUser } = await supabase.from('users').select('*').eq('username', username).maybeSingle();

      if (!storedUser) {
        await supabase.from('login_logs').insert({
          username, role: 'user', ip_address: ip, user_agent: userAgent,
          success: false, fail_reason: 'نام کاربری در سامانه یافت نشد'
        });
        return json({ success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' }, 401);
      }

      const isMatch = bcrypt.compareSync(password, storedUser.password_hash);
      if (!isMatch) {
        await supabase.from('login_logs').insert({
          user_id: storedUser.id, username: storedUser.username, role: storedUser.role,
          ip_address: ip, user_agent: userAgent, success: false, fail_reason: 'رمز عبور نادرست'
        });
        return json({ success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' }, 401);
      }

      if (!storedUser.is_active) {
        await supabase.from('login_logs').insert({
          user_id: storedUser.id, username: storedUser.username, role: storedUser.role,
          ip_address: ip, user_agent: userAgent, success: false, fail_reason: 'حساب کاربری مسدود / غیرفعال است'
        });
        return json({ success: false, error: 'حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سامانه تماس بگیرید.' }, 403);
      }

      await supabase.from('login_logs').insert({
        user_id: storedUser.id, username: storedUser.username, role: storedUser.role,
        ip_address: ip, user_agent: userAgent, success: true
      });

      const token = randomToken();
      const expiresAt = new Date(Date.now() + 365 * 86_400_000).toISOString();
      await supabase.from('sessions').insert({ user_id: storedUser.id, token, ip_address: ip, user_agent: userAgent, expires_at: expiresAt });
      await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', storedUser.id);

      const user = await enrichUser(supabase, storedUser);
      return json({ success: true, token, user, message: 'با موفقیت وارد شدید.' }, 200, { 'Set-Cookie': authCookieHeader(token) });
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      const token = getToken(request);
      if (token) await supabase.from('sessions').delete().eq('token', token);
      return json({ success: true, message: 'با موفقیت خارج شدید.' }, 200, { 'Set-Cookie': authCookieHeader(null) });
    }

    if (pathname === '/api/auth/session' && method === 'GET') {
      const { user } = await getCurrentUser(supabase, request);
      return json({ success: true, user: user || null });
    }

    // ---------------- PUBLIC ----------------
    if (pathname === '/api/public/settings' && method === 'GET') {
      const settings = await getSettingsMap(supabase);
      return json({ success: true, settings });
    }

    if (pathname === '/api/typography/options' && method === 'GET') {
      const tables = ['typography_styles', 'typography_forms', 'materials', 'dimension_options', 'lighting_options', 'shadow_options', 'aspect_ratio_options', 'ai_models'];
      const results = await Promise.all(
        tables.map(t => supabase.from(t).select('*').eq('active', true).order('sort_order'))
      );
      const settings = await getSettingsMap(supabase);
      return json({
        success: true,
        styles: results[0].data || [],
        forms: results[1].data || [],
        materials: results[2].data || [],
        dimensions: results[3].data || [],
        lightings: results[4].data || [],
        shadows: results[5].data || [],
        aspectRatios: results[6].data || [],
        aiModels: results[7].data || [],
        settings
      });
    }

    // ---------------- PROMPT GENERATION (requires login) ----------------
    if (pathname === '/api/prompts/generate' && method === 'POST') {
      const { user } = await getCurrentUser(supabase, request);
      if (!user) return json({ success: false, error: 'نشست شما منقضی شده یا وارد حساب کاربری نشده‌اید.' }, 401);
      if (!user.is_active) return json({ success: false, error: 'حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سامانه تماس بگیرید.' }, 403);
      if (rateLimited(`gen:${user.id}`, 30, 60 * 1000)) {
        return json({ success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند دقیقه دیگر دوباره تلاش کنید.' }, 429);
      }

      try {
        const result = await generatePrompt(supabase, body || {}, { isGenerateAgain: false });
        await supabase.from('generation_logs').insert({
          user_id: user.id, username: user.username, master_prompt_id: result.masterPrompt.id,
          master_prompt_name: result.masterPrompt.name_fa, ai_model_id: body?.aiModelId,
          style_id: body?.calligraphyStyleId, form_id: body?.typographyFormId, is_generate_again: false
        });
        return json({
          success: true, prompt: result.prompt, masterPromptId: result.masterPrompt.id,
          masterPromptName: result.masterPrompt.name_fa, masterPromptIndex: result.masterPromptIndex,
          totalActiveMasterPrompts: result.totalActive, message: 'پرامپت با موفقیت تولید شد.'
        });
      } catch (err: any) {
        return json({ success: false, error: err.message || 'در تولید پرامپت خطایی رخ داد.' }, 400);
      }
    }

    if (pathname === '/api/prompts/generate-again' && method === 'POST') {
      const { user } = await getCurrentUser(supabase, request);
      if (!user) return json({ success: false, error: 'نشست شما منقضی شده یا وارد حساب کاربری نشده‌اید.' }, 401);
      if (!user.is_active) return json({ success: false, error: 'حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سامانه تماس بگیرید.' }, 403);
      if (rateLimited(`gen:${user.id}`, 30, 60 * 1000)) {
        return json({ success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند دقیقه دیگر دوباره تلاش کنید.' }, 429);
      }

      const { config, currentMasterPromptIndex } = body || {};
      if (!config) return json({ success: false, error: 'تنظیمات ارسال نشده است.' }, 400);

      try {
        const result = await generatePrompt(supabase, config, {
          currentMasterPromptIndex: typeof currentMasterPromptIndex === 'number' ? currentMasterPromptIndex : 0,
          isGenerateAgain: true
        });
        await supabase.from('generation_logs').insert({
          user_id: user.id, username: user.username, master_prompt_id: result.masterPrompt.id,
          master_prompt_name: result.masterPrompt.name_fa, ai_model_id: config?.aiModelId,
          style_id: config?.calligraphyStyleId, form_id: config?.typographyFormId, is_generate_again: true
        });
        return json({
          success: true, prompt: result.prompt, masterPromptId: result.masterPrompt.id,
          masterPromptName: result.masterPrompt.name_fa, masterPromptIndex: result.masterPromptIndex,
          totalActiveMasterPrompts: result.totalActive, cycleCompleted: result.cycleCompleted,
          message: `پرامپت با استفاده از ${result.masterPrompt.name_fa} بازتولید شد.`
        });
      } catch (err: any) {
        return json({ success: false, error: err.message || 'در تولید دوباره پرامپت خطایی رخ داد.' }, 400);
      }
    }

    if (pathname === '/api/prompts/copy-event' && method === 'POST') {
      const { user } = await getCurrentUser(supabase, request);
      if (!user) return json({ success: false, error: 'نشست شما منقضی شده یا وارد حساب کاربری نشده‌اید.' }, 401);
      return json({ success: true });
    }

    // ---------------- ADMIN (not ported yet) ----------------
    if (pathname.startsWith('/api/admin/')) {
      return json({
        success: false,
        error: 'پنل مدیریت هنوز به Supabase وصل نشده است (فاز بعدی). بخش ورود و مولد پرامپت کاملاً فعال است.',
        notImplemented: true
      }, 501);
    }

    // ---------------- Fallback ----------------
    return json({ success: false, error: 'مسیر یافت نشد.', path: pathname }, 404);
  } catch (err: any) {
    return json({ success: false, error: 'خطای غیرمنتظره سرور.', detail: String(err?.message || err) }, 500);
  }
};
