import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import {
  INITIAL_MASTER_PROMPTS,
  INITIAL_TYPOGRAPHY_STYLES,
  INITIAL_TYPOGRAPHY_FORMS,
  INITIAL_MATERIALS,
  INITIAL_DIMENSIONS,
  INITIAL_LIGHTINGS,
  INITIAL_SHADOWS,
  INITIAL_ASPECT_RATIOS,
  INITIAL_AI_MODELS,
  DEFAULT_APP_SETTINGS
} from './server/constants.js';

export interface Env {
  ASSETS: {
    fetch: (request: Request | string, init?: RequestInit) => Promise<Response>;
  };
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  DATABASE_URL?: string;
  JWT_SECRET?: string;
}

/**
 * Initialize Supabase client securely from runtime environment secrets
 */
function getSupabase(env: Env): SupabaseClient {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('متغیرهای SUPABASE_URL یا SUPABASE_SERVICE_ROLE_KEY در تنظیمات Environment Variables کلودفلر وارد نشده‌اند.');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function getClientIp(request: Request): string {
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return 'مرورگر استاندارد';
  let browser = 'مرورگر';
  let os = 'دستگاه';
  if (/Windows/i.test(ua)) os = 'ویندوز';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'مک‌اواس';
  else if (/Android/i.test(ua)) os = 'اندروید';
  else if (/iPhone|iPad/i.test(ua)) os = 'آی‌اواس';
  else if (/Linux/i.test(ua)) os = 'لینوکس';

  if (/Edg/i.test(ua)) browser = 'مایکروسافت اج';
  else if (/Chrome/i.test(ua)) browser = 'گوگل کروم';
  else if (/Firefox/i.test(ua)) browser = 'موزیلا فایرفاکس';
  else if (/Safari/i.test(ua)) browser = 'سافاری';

  return `${browser} (${os})`;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

function jsonResponse(data: any, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...extraHeaders
    }
  });
}

/**
 * Central API Request Router for Cloudflare Edge
 */
async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, '');
  const method = request.method;
  const clientIp = getClientIp(request);
  const ua = request.headers.get('user-agent') || '';
  const deviceInfo = parseUserAgent(ua);

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 1. Health check endpoint
  if (pathname === '/api/health') {
    return jsonResponse({
      status: 'ok',
      runtime: 'Cloudflare Worker (worker.ts)',
      hasSupabaseConfig: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
      time: new Date().toISOString()
    });
  }

  let supabase: SupabaseClient;
  try {
    supabase = getSupabase(env);
  } catch (err: any) {
    return jsonResponse({
      success: false,
      error: err?.message || 'پیکربندی دیتابیس Supabase در Cloudflare ناقص است.'
    }, 500);
  }

  // Helper to extract authenticated user from token or cookie
  const getUserFromRequest = async (): Promise<any | null> => {
    let token: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/auth_token=([^;]+)/);
        if (match) token = decodeURIComponent(match[1]);
      }
    }

    if (!token) return null;

    try {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('user_id, expires_at')
        .eq('token', token)
        .single();

      if (!sessionData) return null;
      if (new Date(sessionData.expires_at).getTime() < Date.now()) return null;

      const { data: userData } = await supabase
        .from('users')
        .select('id, username, role, is_active, is_suspicious, created_at, updated_at')
        .eq('id', sessionData.user_id)
        .single();

      return userData || null;
    } catch {
      return null;
    }
  };

  try {
    // -------------------------------------------------------------
    // 2. Public / Init Generator Options
    // -------------------------------------------------------------
    if ((pathname === '/api/typography/options' || pathname === '/api/init-data') && method === 'GET') {
      let [
        stylesRes,
        formsRes,
        materialsRes,
        dimensionsRes,
        lightingsRes,
        shadowsRes,
        aspectRatiosRes,
        aiModelsRes,
        promptsRes
      ] = await Promise.all([
        supabase.from('typography_styles').select('*').order('sort_order'),
        supabase.from('typography_forms').select('*').order('sort_order'),
        supabase.from('materials').select('*').order('sort_order'),
        supabase.from('dimension_options').select('*').order('sort_order'),
        supabase.from('lighting_options').select('*').order('sort_order'),
        supabase.from('shadow_options').select('*').order('sort_order'),
        supabase.from('aspect_ratio_options').select('*').order('sort_order'),
        supabase.from('ai_models').select('*').order('sort_order'),
        supabase.from('master_prompts').select('*').eq('active', true).order('sort_order')
      ]);

      return jsonResponse({
        success: true,
        styles: (stylesRes.data && stylesRes.data.length > 0) ? stylesRes.data : INITIAL_TYPOGRAPHY_STYLES,
        forms: (formsRes.data && formsRes.data.length > 0) ? formsRes.data : INITIAL_TYPOGRAPHY_FORMS,
        materials: (materialsRes.data && materialsRes.data.length > 0) ? materialsRes.data : INITIAL_MATERIALS,
        dimensions: (dimensionsRes.data && dimensionsRes.data.length > 0) ? dimensionsRes.data : INITIAL_DIMENSIONS,
        lightings: (lightingsRes.data && lightingsRes.data.length > 0) ? lightingsRes.data : INITIAL_LIGHTINGS,
        shadows: (shadowsRes.data && shadowsRes.data.length > 0) ? shadowsRes.data : INITIAL_SHADOWS,
        aspectRatios: (aspectRatiosRes.data && aspectRatiosRes.data.length > 0) ? aspectRatiosRes.data : INITIAL_ASPECT_RATIOS,
        aiModels: (aiModelsRes.data && aiModelsRes.data.length > 0) ? aiModelsRes.data : INITIAL_AI_MODELS,
        masterPrompts: (promptsRes.data && promptsRes.data.length > 0) ? promptsRes.data : INITIAL_MASTER_PROMPTS,
        settings: DEFAULT_APP_SETTINGS
      });
    }

    // -------------------------------------------------------------
    // 3. Authentication: Login / Logout / Session
    // -------------------------------------------------------------
    if ((pathname === '/api/auth/login' || pathname === '/api/login') && method === 'POST') {
      const body = await request.json() as any;
      const username = (body.username || '').trim().toLowerCase();
      const password = body.password || '';

      if (!username || !password) {
        return jsonResponse({ success: false, error: 'نام کاربری و کلمه عبور الزامی است.' }, 400);
      }

      // Query user
      let { data: user } = await supabase
        .from('users')
        .select('*')
        .ilike('username', username)
        .single();

      let valid = false;
      if (user) {
        valid = bcrypt.compareSync(password, user.password_hash);
      } else if (username === 'parsa' && password === '13101389') {
        // Auto-provision initial superadmin if table is fresh
        const hash = bcrypt.hashSync('13101389', 10);
        const { data: newUser } = await supabase.from('users').insert({
          username: 'parsa',
          role: 'admin',
          password_hash: hash,
          is_active: true
        }).select().single();
        user = newUser;
        valid = true;
      }

      if (!user || !valid) {
        // Log failed login
        await supabase.from('login_logs').insert({
          username,
          role: 'user',
          ip_address: clientIp,
          user_agent: deviceInfo,
          success: false,
          fail_reason: 'نام کاربری یا رمز عبور نامعتبر'
        });
        return jsonResponse({ success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' }, 401);
      }

      if (!user.is_active) {
        await supabase.from('login_logs').insert({
          user_id: user.id,
          username: user.username,
          role: user.role,
          ip_address: clientIp,
          user_agent: deviceInfo,
          success: false,
          fail_reason: 'حساب غیرفعال شده است'
        });
        return jsonResponse({ success: false, error: 'حساب کاربری شما غیرفعال شده است.' }, 403);
      }

      // Create session
      const token = 'tok_' + crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await supabase.from('sessions').insert({
        user_id: user.id,
        token,
        ip_address: clientIp,
        user_agent: deviceInfo,
        expires_at: expiresAt
      });

      // Log success
      await supabase.from('login_logs').insert({
        user_id: user.id,
        username: user.username,
        role: user.role,
        ip_address: clientIp,
        user_agent: deviceInfo,
        success: true
      });

      const { password_hash, ...safeUser } = user;
      const cookieVal = `auth_token=${encodeURIComponent(token)}; Path=/; Max-Age=2592000; SameSite=Lax; HttpOnly`;

      return jsonResponse({
        success: true,
        user: safeUser,
        token
      }, 200, { 'Set-Cookie': cookieVal });
    }

    if ((pathname === '/api/auth/session' || pathname === '/api/me') && method === 'GET') {
      const user = await getUserFromRequest();
      if (!user) {
        return jsonResponse({ success: true, user: null }, 200);
      }
      return jsonResponse({ success: true, user });
    }

    if ((pathname === '/api/auth/logout' || pathname === '/api/logout') && method === 'POST') {
      const cookieVal = `auth_token=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`;
      return jsonResponse({ success: true }, 200, { 'Set-Cookie': cookieVal });
    }

    // -------------------------------------------------------------
    // 4. Prompt Generation Engine (Cloudflare Edge Implementation)
    // -------------------------------------------------------------
    if ((pathname === '/api/prompts/generate' || pathname === '/api/prompts/generate-again') && method === 'POST') {
      const user = await getUserFromRequest();
      if (!user) {
        return jsonResponse({ success: false, error: 'برای تولید پرامپت باید وارد سامانه شوید.' }, 401);
      }

      const body = await request.json() as any;
      const isAgain = pathname === '/api/prompts/generate-again';
      const config = isAgain ? body.config : body;

      if (!config || !config.title || !config.title.trim()) {
        return jsonResponse({ success: false, error: 'متن یا عبارت خوشنویسی الزامی است.' }, 400);
      }

      // Fetch active master prompts
      const { data: dbPrompts } = await supabase
        .from('master_prompts')
        .select('*')
        .eq('active', true)
        .order('sort_order');

      const masterPrompts = (dbPrompts && dbPrompts.length > 0) ? dbPrompts : INITIAL_MASTER_PROMPTS.filter(p => p.active);
      const totalActive = masterPrompts.length;
      let promptIndex = 0;

      if (isAgain) {
        const currentIndex = typeof body.currentMasterPromptIndex === 'number' ? body.currentMasterPromptIndex : 0;
        promptIndex = (currentIndex + 1) % totalActive;
      }

      const selectedMaster = masterPrompts[promptIndex] || masterPrompts[0];

      // Fetch options for text description resolution
      const [stylesRes, formsRes, materialsRes, dimensionsRes, lightingsRes, shadowsRes, aspectRatiosRes, aiModelsRes] = await Promise.all([
        supabase.from('typography_styles').select('*'),
        supabase.from('typography_forms').select('*'),
        supabase.from('materials').select('*'),
        supabase.from('dimension_options').select('*'),
        supabase.from('lighting_options').select('*'),
        supabase.from('shadow_options').select('*'),
        supabase.from('aspect_ratio_options').select('*'),
        supabase.from('ai_models').select('*')
      ]);

      const allStyles = stylesRes.data?.length ? stylesRes.data : INITIAL_TYPOGRAPHY_STYLES;
      const allForms = formsRes.data?.length ? formsRes.data : INITIAL_TYPOGRAPHY_FORMS;
      const allMaterials = materialsRes.data?.length ? materialsRes.data : INITIAL_MATERIALS;
      const allDimensions = dimensionsRes.data?.length ? dimensionsRes.data : INITIAL_DIMENSIONS;
      const allLightings = lightingsRes.data?.length ? lightingsRes.data : INITIAL_LIGHTINGS;
      const allShadows = shadowsRes.data?.length ? shadowsRes.data : INITIAL_SHADOWS;
      const allAspectRatios = aspectRatiosRes.data?.length ? aspectRatiosRes.data : INITIAL_ASPECT_RATIOS;
      const allAiModels = aiModelsRes.data?.length ? aiModelsRes.data : INITIAL_AI_MODELS;

      const style = allStyles.find((s: any) => s.id === config.calligraphyStyleId) || allStyles[0];
      const form = allForms.find((f: any) => f.id === config.typographyFormId) || allForms[0];
      const material = allMaterials.find((m: any) => m.id === config.materialId) || allMaterials[0];
      const dimension = allDimensions.find((d: any) => d.id === config.dimensionId) || allDimensions[0];
      const lighting = allLightings.find((l: any) => l.id === config.lightingId) || allLightings[0];
      const shadow = allShadows.find((s: any) => s.id === config.shadowingId) || allShadows[0];
      const aspectRatio = allAspectRatios.find((a: any) => a.id === config.aspectRatioId) || allAspectRatios[0];
      const aiModel = allAiModels.find((m: any) => m.id === config.aiModelId) || allAiModels[0];

      let backgroundStatus = 'No background / Isolated graphic typography presentation';
      let backgroundColorHex = 'Transparent background (if supported by target AI model) / Clean isolated canvas with zero accidental background environment';

      if (config.backgroundStatus === 'has_background') {
        backgroundStatus = 'Enabled solid custom colored background canvas';
        backgroundColorHex = (config.backgroundColorHex || '#F1E8E6').toUpperCase();
      }

      const variableMap: Record<string, string> = {
        '{{TITLE}}': config.title,
        '{{CALLIGRAPHY_STYLE}}': style ? `${style.name_fa} (${style.category === 'traditional' ? 'Traditional Persian Calligraphy' : 'Artistic Persian Typography'}): ${style.ai_description_en}` : 'Authentic Persian Calligraphy',
        '{{TYPOGRAPHY_FORM}}': form ? `${form.name_fa}: ${form.ai_instruction_en}` : 'Natural organic Persian typography composition',
        '{{TITLE_COLOR_HEX}}': (config.titleColorHex || '#F55951').toUpperCase(),
        '{{BACKGROUND_STATUS}}': backgroundStatus,
        '{{BACKGROUND_COLOR_HEX}}': backgroundColorHex,
        '{{MATERIAL}}': material ? `${material.name_fa} - ${material.ai_description_en}` : 'Traditional rich calligraphic ink',
        '{{DIMENSION}}': dimension ? `${dimension.name_fa} - ${dimension.ai_description_en}` : 'Flat 2D graphic typography',
        '{{LIGHTING}}': lighting ? `${lighting.name_fa} - ${lighting.ai_description_en}` : 'Soft even studio ambient lighting',
        '{{SHADOWING}}': shadow ? `${shadow.name_fa} - ${shadow.ai_description_en}` : 'No shadow',
        '{{ASPECT_RATIO}}': aspectRatio ? aspectRatio.value : '1:1',
        '{{AI_MODEL}}': aiModel ? aiModel.ai_name_en : 'Generic Flagship Image Generator'
      };

      let renderedPrompt = selectedMaster.template;
      for (const [key, val] of Object.entries(variableMap)) {
        renderedPrompt = renderedPrompt.split(key).join(val);
      }

      // Telemetry log
      await supabase.from('generation_logs').insert({
        user_id: user.id,
        username: user.username,
        master_prompt_id: selectedMaster.id,
        master_prompt_name: selectedMaster.name_fa,
        ai_model_id: config.aiModelId,
        style_id: config.calligraphyStyleId,
        form_id: config.typographyFormId,
        is_generate_again: isAgain
      });

      return jsonResponse({
        success: true,
        prompt: renderedPrompt,
        masterPromptId: selectedMaster.id,
        masterPromptName: selectedMaster.name_fa,
        masterPromptIndex: promptIndex,
        totalActiveMasterPrompts: totalActive,
        cycleCompleted: isAgain && promptIndex === 0,
        message: isAgain ? `پرامپت با استفاده از ${selectedMaster.name_fa} بازتولید شد.` : 'پرامپت با موفقیت تولید شد.'
      });
    }

    if (pathname === '/api/prompts/copy-event' && method === 'POST') {
      return jsonResponse({ success: true });
    }

    // -------------------------------------------------------------
    // 5. Feedback & Suggestions
    // -------------------------------------------------------------
    if (pathname === '/api/feedback' && method === 'POST') {
      const body = await request.json() as any;
      const user = await getUserFromRequest();

      const { error } = await supabase.from('feedback_reports').insert({
        user_id: user?.id || null,
        username: user?.username || 'ناشناس',
        type: body.type || 'suggestion',
        title: body.title || 'بدون عنوان',
        description: body.description || '',
        status: 'unread',
        ip_address: clientIp
      });

      if (error) {
        return jsonResponse({ success: false, error: error.message }, 500);
      }
      return jsonResponse({ success: true, message: 'پیام با موفقیت ثبت شد.' });
    }

    // -------------------------------------------------------------
    // 6. Admin Panel Endpoints (Guarded by requireAdmin)
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/admin/')) {
      const user = await getUserFromRequest();
      if (!user || user.role !== 'admin') {
        return jsonResponse({ success: false, error: 'دسترسی غیرمجاز (فقط مدیر کل سامانه).' }, 403);
      }

      // Admin Dashboard / Stats
      if (pathname === '/api/admin/dashboard' || pathname === '/api/admin/stats') {
        const [
          usersCount,
          activeUsersCount,
          inactiveUsersCount,
          secEventsCount,
          genCount,
          genAgainCount,
          promptsCount,
          stylesCount,
          recentLoginsRes
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', false),
          supabase.from('security_events').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('generation_logs').select('*', { count: 'exact', head: true }),
          supabase.from('generation_logs').select('*', { count: 'exact', head: true }).eq('is_generate_again', true),
          supabase.from('master_prompts').select('*', { count: 'exact', head: true }).eq('active', true),
          supabase.from('typography_styles').select('*', { count: 'exact', head: true }).eq('active', true),
          supabase.from('login_logs').select('*').order('timestamp', { ascending: false }).limit(6)
        ]);

        return jsonResponse({
          success: true,
          stats: {
            totalUsers: usersCount.count || 0,
            activeUsers: activeUsersCount.count || 0,
            inactiveUsers: inactiveUsersCount.count || 0,
            pendingSecurityEvents: secEventsCount.count || 0,
            totalGenerations: genCount.count || 0,
            totalGenerateAgain: genAgainCount.count || 0,
            activeMasterPrompts: promptsCount.count || 0,
            activeStyles: stylesCount.count || 0,
            recentLogins: recentLoginsRes.data || [],
            recentAudits: []
          }
        });
      }

      // Admin Users CRUD
      if (pathname === '/api/admin/users') {
        if (method === 'GET') {
          const { data: users } = await supabase
            .from('users')
            .select('id, username, role, is_active, is_suspicious, created_at, updated_at')
            .order('created_at', { ascending: false });
          return jsonResponse({ success: true, users: users || [] });
        }

        if (method === 'POST') {
          const body = await request.json() as any;
          const { username, password, role } = body;
          if (!username || !password) {
            return jsonResponse({ success: false, error: 'نام کاربری و رمز عبور الزامی است.' }, 400);
          }

          const password_hash = bcrypt.hashSync(password, 10);
          const { data: newUser, error } = await supabase.from('users').insert({
            username: username.trim().toLowerCase(),
            role: role || 'user',
            password_hash,
            is_active: true
          }).select('id, username, role, is_active, is_suspicious, created_at, updated_at').single();

          if (error) {
            return jsonResponse({ success: false, error: error.message }, 400);
          }

          return jsonResponse({ success: true, user: newUser, message: 'کاربر با موفقیت ایجاد شد.' });
        }
      }

      // Single User Operations
      const userMatch = pathname.match(/^\/api\/admin\/users\/([^\/]+)(\/.*)?$/);
      if (userMatch) {
        const targetUserId = userMatch[1];
        const subAction = userMatch[2];

        if (subAction === '/reset-password' && method === 'POST') {
          const body = await request.json() as any;
          const hash = bcrypt.hashSync(body.newPassword, 10);
          await supabase.from('users').update({ password_hash: hash, updated_at: new Date().toISOString() }).eq('id', targetUserId);
          return jsonResponse({ success: true, message: 'رمز عبور کاربر با موفقیت تغییر یافت.' });
        }

        if (subAction === '/history' && method === 'GET') {
          const { data: logs } = await supabase
            .from('login_logs')
            .select('*')
            .eq('user_id', targetUserId)
            .order('timestamp', { ascending: false })
            .limit(20);
          return jsonResponse({ success: true, history: { recentLogs: logs || [], totalLogins: logs?.length || 0, uniqueIps: [] } });
        }

        if (!subAction && method === 'PATCH') {
          const body = await request.json() as any;
          const { data: updated, error } = await supabase
            .from('users')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', targetUserId)
            .select('id, username, role, is_active, is_suspicious, created_at, updated_at')
            .single();

          if (error) return jsonResponse({ success: false, error: error.message }, 400);
          return jsonResponse({ success: true, user: updated, message: 'اطلاعات کاربر ویرایش شد.' });
        }

        if (!subAction && method === 'DELETE') {
          await supabase.from('users').delete().eq('id', targetUserId);
          return jsonResponse({ success: true, message: 'کاربر با موفقیت حذف گردید.' });
        }
      }

      // Admin Login Logs
      if (pathname === '/api/admin/login-logs' && method === 'GET') {
        const { data: logs } = await supabase
          .from('login_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);
        return jsonResponse({ success: true, logs: logs || [], total: logs?.length || 0, totalPages: 1 });
      }

      // Admin Feedback Reports
      if (pathname === '/api/admin/feedback-reports') {
        if (method === 'GET') {
          const { data: reports } = await supabase
            .from('feedback_reports')
            .select('*')
            .order('created_at', { ascending: false });
          return jsonResponse({ success: true, reports: reports || [] });
        }
      }

      // Admin Master Prompts
      if (pathname === '/api/admin/master-prompts') {
        if (method === 'GET') {
          const { data: prompts } = await supabase
            .from('master_prompts')
            .select('*')
            .order('sort_order');
          return jsonResponse({ success: true, prompts: prompts?.length ? prompts : INITIAL_MASTER_PROMPTS });
        }
      }

      // Admin Styles
      if (pathname === '/api/admin/styles') {
        if (method === 'GET') {
          const { data: styles } = await supabase
            .from('typography_styles')
            .select('*')
            .order('sort_order');
          return jsonResponse({ success: true, styles: styles?.length ? styles : INITIAL_TYPOGRAPHY_STYLES });
        }
      }
    }

    // Default Fallback for Unmatched API Routes
    return jsonResponse({
      success: false,
      error: 'مسیر API مورد نظر یافت نشد.',
      path: pathname
    }, 404);

  } catch (err: any) {
    return jsonResponse({
      success: false,
      error: 'خطای سرور ابری کلودفلر: ' + (err?.message || 'نامشخص')
    }, 500);
  }
}

/**
 * Standard Cloudflare Worker export (compatible with Cloudflare Workers Builds)
 */
export default {
  async fetch(request: Request, env: Env, ctx?: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. If it's an API route, handle with backend logic
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }

    // 2. Serve static assets (React SPA frontend, fonts, images, JS, CSS) from ./dist
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('سایت در حال بیلد شدن است یا Asset Binding در دسترس نیست.', { status: 404 });
  }
};
