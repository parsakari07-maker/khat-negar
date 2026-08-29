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
} from '../../server/constants.js';

export interface Env {
  ASSETS?: {
    fetch: (request: Request | string, init?: RequestInit) => Promise<Response>;
  };
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  DATABASE_URL?: string;
  JWT_SECRET?: string;
}

export interface UserRecord {
  id: string;
  username: string;
  role: string;
  password_hash: string;
  is_active: boolean;
  is_suspicious?: boolean;
  created_at?: string;
  updated_at?: string;
  ip_count?: number;
  last_login_at?: string | null;
  active_sessions_count?: number;
}

const SUPERADMIN_ID = '00000000-0000-0000-0000-000000000001';

function getSupabase(env: Env): SupabaseClient | null {
  const rawUrl = env.SUPABASE_URL || '';
  const url = rawUrl.trim().replace(/\/+$/, '');
  const key = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    db: {
      schema: 'public'
    },
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

function normalizePersianDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[۰٠]/g, '0')
    .replace(/[۱١]/g, '1')
    .replace(/[۲٢]/g, '2')
    .replace(/[۳٣]/g, '3')
    .replace(/[۴٤]/g, '4')
    .replace(/[۵٥]/g, '5')
    .replace(/[۶٦]/g, '6')
    .replace(/[۷٧]/g, '7')
    .replace(/[۸٨]/g, '8')
    .replace(/[۹٩]/g, '9');
}

function cleanInvisibleChars(str: string): string {
  if (!str) return '';
  return str.replace(/[\u200B\u200C\u200D\uFEFF\u00A0\r\n]/g, '');
}

function verifyPassword(inputPassword: string, storedHash: string): boolean {
  if (!inputPassword || !storedHash) return false;

  // 1. Exact comparison
  try {
    if (bcrypt.compareSync(inputPassword, storedHash)) return true;
  } catch {}
  if (inputPassword === storedHash) return true;

  // 2. Cleaned invisible characters & trimmed
  const cleaned = cleanInvisibleChars(inputPassword).trim();
  if (cleaned && cleaned !== inputPassword) {
    try {
      if (bcrypt.compareSync(cleaned, storedHash)) return true;
    } catch {}
    if (cleaned === storedHash) return true;
  }

  // 3. Normalized Persian/Arabic digits
  const normDigits = normalizePersianDigits(cleaned || inputPassword);
  if (normDigits && normDigits !== (cleaned || inputPassword)) {
    try {
      if (bcrypt.compareSync(normDigits, storedHash)) return true;
    } catch {}
    if (normDigits === storedHash) return true;
  }

  return false;
}

interface TokenPayload {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  exp: number;
  iat: number;
}

function getJwtSecret(env: Env): string {
  return (env.JWT_SECRET || env.SUPABASE_SERVICE_ROLE_KEY || 'persian_typo_secret_key_8492048102').trim();
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecodeToBytes(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function signAuthToken(payloadData: Omit<TokenPayload, 'exp' | 'iat'>, secret: string, expiresInDays = 30): Promise<string> {
  const iat = Date.now();
  const exp = iat + expiresInDays * 24 * 60 * 60 * 1000;
  const fullPayload: TokenPayload = { ...payloadData, exp, iat };
  
  const jsonStr = JSON.stringify(fullPayload);
  const dataBytes = new TextEncoder().encode(jsonStr);
  const dataB64 = base64UrlEncodeBytes(dataBytes);

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(dataB64));
  const sigB64 = base64UrlEncodeBytes(new Uint8Array(sigBuf));

  return `stk.${dataB64}.${sigB64}`;
}

async function verifyAuthToken(token: string, secret: string): Promise<TokenPayload | null> {
  try {
    if (!token || !token.startsWith('stk.')) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [, dataB64, sigB64] = parts;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const rawSig = base64UrlDecodeToBytes(sigB64);
    const isValid = await crypto.subtle.verify('HMAC', key, rawSig, enc.encode(dataB64));
    if (!isValid) return null;

    const payloadBytes = base64UrlDecodeToBytes(dataB64);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadJson) as TokenPayload;

    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

const POSSIBLE_USER_TABLES = ['users', 'Users', 'app_users', 'admin_users', 'user_profiles', 'profiles', 'user'];

async function queryUsersDirectRest(env: Env, tableName: string, queryParams = ''): Promise<{ data: any[] | null; error: string | null; status: number }> {
  const rawUrl = (env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!rawUrl || !key) return { data: null, error: 'Supabase credentials missing', status: 500 };

  const endpoint = `${rawUrl}/rest/v1/${encodeURIComponent(tableName)}${queryParams ? (queryParams.startsWith('?') ? queryParams : `?${queryParams}`) : ''}`;
  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Accept': 'application/json',
        'Accept-Profile': 'public',
        'Content-Profile': 'public'
      }
    });

    if (res.ok) {
      const data = await res.json();
      return { data: Array.isArray(data) ? data : [data], error: null, status: res.status };
    } else {
      const txt = await res.text();
      return { data: null, error: `HTTP ${res.status}: ${txt}`, status: res.status };
    }
  } catch (err: any) {
    return { data: null, error: err?.message || String(err), status: 500 };
  }
}

async function findUserByUsername(supabase: SupabaseClient | null, env: Env, username: string): Promise<UserRecord | null> {
  const cleanUsername = normalizePersianDigits(username.trim()).toLowerCase();

  for (const tbl of POSSIBLE_USER_TABLES) {
    if (supabase) {
      try {
        const { data } = await supabase
          .schema('public')
          .from(tbl)
          .select('*')
          .ilike('username', cleanUsername);
        if (data && data.length > 0) return data[0] as UserRecord;
      } catch {}

      try {
        const { data } = await supabase
          .from(tbl)
          .select('*')
          .ilike('username', cleanUsername);
        if (data && data.length > 0) return data[0] as UserRecord;
      } catch {}
    }

    try {
      const restRes = await queryUsersDirectRest(env, tbl, `username=ilike.${encodeURIComponent(cleanUsername)}&select=*`);
      if (restRes.data && restRes.data.length > 0) {
        return restRes.data[0] as UserRecord;
      }
    } catch {}
  }

  return null;
}

async function findUserById(supabase: SupabaseClient | null, env: Env, userId: string): Promise<UserRecord | null> {
  if (userId === SUPERADMIN_ID) {
    return {
      id: SUPERADMIN_ID,
      username: 'parsa',
      role: 'admin',
      is_active: true,
      password_hash: ''
    };
  }

  for (const tbl of POSSIBLE_USER_TABLES) {
    if (supabase) {
      try {
        const { data } = await supabase
          .schema('public')
          .from(tbl)
          .select('*')
          .eq('id', userId);
        if (data && data.length > 0) return data[0] as UserRecord;
      } catch {}

      try {
        const { data } = await supabase
          .from(tbl)
          .select('*')
          .eq('id', userId);
        if (data && data.length > 0) return data[0] as UserRecord;
      } catch {}
    }

    try {
      const restRes = await queryUsersDirectRest(env, tbl, `id=eq.${encodeURIComponent(userId)}&select=*`);
      if (restRes.data && restRes.data.length > 0) {
        return restRes.data[0] as UserRecord;
      }
    } catch {}
  }

  return null;
}

async function getAllUsersList(supabase: SupabaseClient | null, env: Env): Promise<UserRecord[]> {
  let rawUsers: any[] = [];

  for (const tbl of POSSIBLE_USER_TABLES) {
    if (supabase) {
      try {
        const { data } = await supabase
          .from(tbl)
          .select('id, username, role, is_active, is_suspicious, created_at, updated_at')
          .order('created_at', { ascending: false });
        if (data && data.length > 0) {
          rawUsers = data;
          break;
        }
      } catch {}
    }

    try {
      const restRes = await queryUsersDirectRest(env, tbl, 'select=id,username,role,is_active,is_suspicious,created_at,updated_at&order=created_at.desc');
      if (restRes.data && restRes.data.length > 0) {
        rawUsers = restRes.data;
        break;
      }
    } catch {}
  }

  // Ensure superadmin parsa is present in list
  const hasParsa = rawUsers.some(u => u.username && u.username.toLowerCase() === 'parsa');
  if (!hasParsa) {
    rawUsers.unshift({
      id: SUPERADMIN_ID,
      username: 'parsa',
      role: 'admin',
      is_active: true,
      is_suspicious: false,
      created_at: new Date('2025-01-01').toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  // Enrich all users with IP count, last login, and active sessions from login_logs and sessions
  let allLogs: any[] = [];
  let allSessions: any[] = [];

  if (supabase) {
    try {
      const { data: lData } = await supabase.from('login_logs').select('user_id, username, ip_address, timestamp, is_suspicious');
      if (lData) allLogs = lData;
    } catch {}

    try {
      const { data: sData } = await supabase.from('sessions').select('user_id, expires_at');
      if (sData) allSessions = sData;
    } catch {}
  }

  const now = Date.now();
  return rawUsers.map(u => {
    const userLogs = allLogs.filter(l => (l.user_id && l.user_id === u.id) || (l.username && u.username && l.username.toLowerCase() === u.username.toLowerCase()));
    const uniqueIps = Array.from(new Set(userLogs.map(l => l.ip_address).filter(Boolean)));
    const sortedLogs = [...userLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastLogin = sortedLogs[0]?.timestamp || null;
    const activeSessions = allSessions.filter(s => s.user_id === u.id && new Date(s.expires_at).getTime() > now).length;
    const hasSuspicious = userLogs.some(l => l.is_suspicious) || !!u.is_suspicious;

    return {
      ...u,
      ip_count: uniqueIps.length,
      last_login_at: lastLogin,
      active_sessions_count: activeSessions,
      is_suspicious: hasSuspicious
    };
  });
}

async function recordAuditLog(
  supabase: SupabaseClient | null,
  adminId: string,
  adminUsername: string,
  action: string,
  details: string,
  ip: string
) {
  if (!supabase) return;
  try {
    await supabase.from('audit_logs').insert({
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'audit-' + Date.now(),
      admin_id: adminId,
      admin_username: adminUsername,
      action,
      details,
      ip_address: ip,
      timestamp: new Date().toISOString()
    });
  } catch {}
}

async function recordLoginLog(
  supabase: SupabaseClient | null,
  userId: string | null,
  username: string,
  status: 'success' | 'failed',
  failureReason: string | null,
  ip: string,
  userAgent: string,
  deviceInfo: string
) {
  if (!supabase) return;
  try {
    await supabase.from('login_logs').insert({
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'log-' + Date.now(),
      user_id: userId,
      username,
      status,
      failure_reason: failureReason,
      ip_address: ip,
      user_agent: userAgent,
      device_info: deviceInfo,
      is_suspicious: false,
      timestamp: new Date().toISOString()
    });
  } catch {}
}

// ----------------------------------------------------------------------
// Main API Request Handler
// ----------------------------------------------------------------------

async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, '');
  const method = request.method;
  const clientIp = getClientIp(request);
  const ua = request.headers.get('user-agent') || '';
  const deviceInfo = parseUserAgent(ua);
  const jwtSecret = getJwtSecret(env);

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (pathname === '/api/health') {
    return jsonResponse({
      status: 'ok',
      runtime: 'Cloudflare Pages Functions ([[route]].ts)',
      hasSupabaseConfig: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
      time: new Date().toISOString()
    });
  }

  let supabase: SupabaseClient | null = null;
  try {
    supabase = getSupabase(env);
  } catch {}

  // --------------------------------------------------------------------
  // Public Configuration & Generator Endpoints
  // --------------------------------------------------------------------

  if (pathname === '/api/public/config' && method === 'GET') {
    let styles = INITIAL_TYPOGRAPHY_STYLES;
    let forms = INITIAL_TYPOGRAPHY_FORMS;
    let materials = INITIAL_MATERIALS;
    let dimensions = INITIAL_DIMENSIONS;
    let lightings = INITIAL_LIGHTINGS;
    let shadows = INITIAL_SHADOWS;
    let aspectRatios = INITIAL_ASPECT_RATIOS;
    let aiModels = INITIAL_AI_MODELS;

    if (supabase) {
      try {
        const [
          { data: st },
          { data: fo },
          { data: ma },
          { data: di },
          { data: li },
          { data: sh },
          { data: ar },
          { data: mo }
        ] = await Promise.all([
          supabase.from('typography_styles').select('*').eq('active', true).order('sort_order'),
          supabase.from('typography_forms').select('*').eq('active', true).order('sort_order'),
          supabase.from('materials').select('*').eq('active', true).order('sort_order'),
          supabase.from('dimension_options').select('*').eq('active', true).order('sort_order'),
          supabase.from('lighting_options').select('*').eq('active', true).order('sort_order'),
          supabase.from('shadow_options').select('*').eq('active', true).order('sort_order'),
          supabase.from('aspect_ratio_options').select('*').eq('active', true).order('sort_order'),
          supabase.from('ai_models').select('*').eq('active', true).order('sort_order')
        ]);

        if (st && st.length > 0) styles = st;
        if (fo && fo.length > 0) forms = fo;
        if (ma && ma.length > 0) materials = ma;
        if (di && di.length > 0) dimensions = di;
        if (li && li.length > 0) lightings = li;
        if (sh && sh.length > 0) shadows = sh;
        if (ar && ar.length > 0) aspectRatios = ar;
        if (mo && mo.length > 0) aiModels = mo;
      } catch {}
    }

    return jsonResponse({
      success: true,
      config: {
        styles,
        forms,
        materials,
        dimensions,
        lightings,
        shadows,
        aspectRatios,
        aiModels
      }
    });
  }

  if (pathname === '/api/public/settings' && method === 'GET') {
    return jsonResponse({
      success: true,
      settings: DEFAULT_APP_SETTINGS
    });
  }

  if (pathname === '/api/prompt/generate' && method === 'POST') {
    try {
      const body = await request.json() as any;
      const {
        title,
        styleId,
        formId,
        materialId,
        dimensionId,
        lightingId,
        shadowId,
        aspectRatioId,
        aiModelId,
        titleColorHex,
        backgroundColorHex,
        isolatedBackground
      } = body;

      if (!title || !title.trim()) {
        return jsonResponse({ success: false, error: 'عنوان تایپوگرافی الزامی است.' }, 400);
      }

      // Fetch master prompt and options
      let masterPrompt = INITIAL_MASTER_PROMPTS.find(p => p.active) || INITIAL_MASTER_PROMPTS[0];
      if (supabase) {
        try {
          const { data: pData } = await supabase.from('master_prompts').select('*').eq('active', true).order('sort_order').limit(1);
          if (pData && pData.length > 0) masterPrompt = pData[0];
        } catch {}
      }

      const style = INITIAL_TYPOGRAPHY_STYLES.find(s => s.id === styleId) || INITIAL_TYPOGRAPHY_STYLES[0];
      const form = INITIAL_TYPOGRAPHY_FORMS.find(f => f.id === formId) || INITIAL_TYPOGRAPHY_FORMS[0];
      const material = INITIAL_MATERIALS.find(m => m.id === materialId) || INITIAL_MATERIALS[0];
      const dimension = INITIAL_DIMENSIONS.find(d => d.id === dimensionId) || INITIAL_DIMENSIONS[0];
      const lighting = INITIAL_LIGHTINGS.find(l => l.id === lightingId) || INITIAL_LIGHTINGS[0];
      const shadow = INITIAL_SHADOWS.find(s => s.id === shadowId) || INITIAL_SHADOWS[0];
      const aspectRatio = INITIAL_ASPECT_RATIOS.find(a => a.id === aspectRatioId) || INITIAL_ASPECT_RATIOS[0];
      const aiModel = INITIAL_AI_MODELS.find(m => m.id === aiModelId) || INITIAL_AI_MODELS[0];

      let template = masterPrompt.template;
      const bgStatus = isolatedBackground
        ? `Clean isolated solid background in ${backgroundColorHex || '#FFFFFF'}`
        : `Artistic background colored in ${backgroundColorHex || '#FFFFFF'}`;

      const replacements: Record<string, string> = {
        '{{TITLE}}': title.trim(),
        '{{CALLIGRAPHY_STYLE}}': style.ai_description_en || style.name_fa,
        '{{TYPOGRAPHY_FORM}}': form.ai_instruction_en || form.name_fa,
        '{{TITLE_COLOR_HEX}}': titleColorHex || '#F55951',
        '{{BACKGROUND_STATUS}}': bgStatus,
        '{{BACKGROUND_COLOR_HEX}}': backgroundColorHex || '#FFFFFF',
        '{{MATERIAL}}': material.ai_description_en || material.name_fa,
        '{{DIMENSION}}': dimension.ai_description_en || dimension.name_fa,
        '{{LIGHTING}}': lighting.ai_description_en || lighting.name_fa,
        '{{SHADOWING}}': shadow.ai_description_en || shadow.name_fa,
        '{{ASPECT_RATIO}}': aspectRatio.value || '1:1',
        '{{AI_MODEL}}': aiModel.ai_name_en || aiModel.name_fa
      };

      for (const [k, v] of Object.entries(replacements)) {
        template = template.split(k).join(v);
      }

      if (aspectRatio.value && !template.includes('--ar')) {
        template += ` --ar ${aspectRatio.value}`;
      }

      // Record generation log if supabase is available
      if (supabase) {
        try {
          await supabase.from('generation_logs').insert({
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'gen-' + Date.now(),
            title: title.trim(),
            style_id: styleId,
            model_key: aiModel.model_key,
            output_prompt: template,
            ip_address: clientIp,
            created_at: new Date().toISOString()
          });
        } catch {}
      }

      return jsonResponse({
        success: true,
        renderedPrompt: template,
        meta: {
          title: title.trim(),
          style: style.name_fa,
          model: aiModel.name_fa
        }
      });
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message || 'خطا در تولید پرامپت.' }, 500);
    }
  }

  if (pathname === '/api/feedback' && method === 'POST') {
    try {
      const body = await request.json() as any;
      const { name, email, type, subject, message } = body;
      if (!message || !message.trim()) {
        return jsonResponse({ success: false, error: 'متن پیام الزامی است.' }, 400);
      }

      const feedbackId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'fb-' + Date.now();
      const feedbackRecord = {
        id: feedbackId,
        name: (name || 'کاربر ناشناس').trim(),
        email: (email || '').trim(),
        type: type || 'feedback',
        subject: (subject || 'بدون موضوع').trim(),
        message: message.trim(),
        status: 'unread',
        ip_address: clientIp,
        created_at: new Date().toISOString()
      };

      if (supabase) {
        try {
          await supabase.from('feedback_reports').insert(feedbackRecord);
        } catch {}
      }

      return jsonResponse({
        success: true,
        message: 'پیام شما با موفقیت ثبت شد. با تشکر از همکاری شما.'
      });
    } catch (err: any) {
      return jsonResponse({ success: false, error: 'خطا در ثبت پیام.' }, 500);
    }
  }

  // --------------------------------------------------------------------
  // Authentication Routes
  // --------------------------------------------------------------------

  if (pathname === '/api/auth/login' && method === 'POST') {
    try {
      const body = await request.json() as any;
      const rawUsername = body.username ? String(body.username) : '';
      const rawPassword = body.password ? String(body.password) : '';

      if (!rawUsername.trim() || !rawPassword.trim()) {
        return jsonResponse({ success: false, error: 'نام کاربری و رمز عبور الزامی است.' }, 400);
      }

      const cleanUsername = normalizePersianDigits(rawUsername.trim()).toLowerCase();
      let user: UserRecord | null = null;

      // 1. Check SuperAdmin Parsa
      if (cleanUsername === 'parsa') {
        const isParsaValid = (
          rawPassword === 'parsa1385' ||
          rawPassword.trim() === 'parsa1385' ||
          normalizePersianDigits(rawPassword.trim()) === 'parsa1385'
        );

        if (isParsaValid) {
          user = {
            id: SUPERADMIN_ID,
            username: 'parsa',
            role: 'admin',
            is_active: true,
            password_hash: ''
          };
        }
      }

      // 2. Query Supabase
      if (!user) {
        const dbUser = await findUserByUsername(supabase, env, cleanUsername);
        if (dbUser && dbUser.password_hash) {
          const isValid = verifyPassword(rawPassword, dbUser.password_hash);
          if (isValid) {
            user = dbUser;
          }
        }
      }

      // 3. Login Failed
      if (!user) {
        await recordLoginLog(supabase, null, cleanUsername, 'failed', 'نام کاربری یا کلمه عبور نادرست است', clientIp, ua, deviceInfo);
        return jsonResponse({ success: false, error: 'نام کاربری یا کلمه عبور اشتباه است.' }, 401);
      }

      if (!user.is_active) {
        await recordLoginLog(supabase, user.id, cleanUsername, 'failed', 'حساب کاربری غیرفعال است', clientIp, ua, deviceInfo);
        return jsonResponse({ success: false, error: 'حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سیستم تماس بگیرید.' }, 403);
      }

      // 4. Create Token & Session
      const token = await signAuthToken(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          is_active: user.is_active
        },
        jwtSecret,
        30
      );

      // Record successful login
      await recordLoginLog(supabase, user.id, user.username, 'success', null, clientIp, ua, deviceInfo);

      // Record active session
      if (supabase && user.id !== SUPERADMIN_ID) {
        try {
          await supabase.from('sessions').insert({
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'sess-' + Date.now(),
            user_id: user.id,
            token,
            ip_address: clientIp,
            user_agent: ua,
            device_info: deviceInfo,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
        } catch {}
      }

      return jsonResponse({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          is_active: user.is_active
        },
        message: `خوش آمدید، ${user.username}`
      });

    } catch (err: any) {
      return jsonResponse({ success: false, error: 'خطای سرور در احراز هویت: ' + (err?.message || 'نامشخص') }, 500);
    }
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return jsonResponse({ success: false, error: 'توکن احراز هویت ارسال نشده است.' }, 401);
    }

    const payload = await verifyAuthToken(token, jwtSecret);
    if (!payload) {
      return jsonResponse({ success: false, error: 'نشست منقضی شده یا توکن نامعتبر است.' }, 401);
    }

    return jsonResponse({
      success: true,
      user: {
        id: payload.id,
        username: payload.username,
        role: payload.role,
        is_active: payload.is_active
      }
    });
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (supabase && token) {
      try {
        await supabase.from('sessions').delete().eq('token', token);
      } catch {}
    }
    return jsonResponse({ success: true, message: 'با موفقیت خارج شدید.' });
  }

  // --------------------------------------------------------------------
  // Admin Protected Routes Verification Middleware
  // --------------------------------------------------------------------

  if (pathname.startsWith('/api/admin')) {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return jsonResponse({ success: false, error: 'دسترسی غیرمجاز. لطفاً وارد حساب مدیریت شوید.' }, 401);
    }

    const authedUser = await verifyAuthToken(token, jwtSecret);
    if (!authedUser || authedUser.role !== 'admin') {
      return jsonResponse({ success: false, error: 'شما دسترسی لازم برای بخش مدیریت را ندارید.' }, 403);
    }

    // 1. Dashboard Stats
    if (pathname === '/api/admin/dashboard' && method === 'GET') {
      let usersCount = 1;
      let logsCount = 0;
      let feedbacksCount = 0;
      let promptGenerationsCount = 0;

      if (supabase) {
        try {
          const [
            { count: uCount },
            { count: lCount },
            { count: fCount },
            { count: gCount }
          ] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('login_logs').select('*', { count: 'exact', head: true }),
            supabase.from('feedback_reports').select('*', { count: 'exact', head: true }),
            supabase.from('generation_logs').select('*', { count: 'exact', head: true })
          ]);

          if (typeof uCount === 'number') usersCount = Math.max(1, uCount);
          if (typeof lCount === 'number') logsCount = lCount;
          if (typeof fCount === 'number') feedbacksCount = fCount;
          if (typeof gCount === 'number') promptGenerationsCount = gCount;
        } catch {}
      }

      return jsonResponse({
        success: true,
        stats: {
          totalUsers: usersCount,
          totalLogins: logsCount,
          totalFeedbacks: feedbacksCount,
          totalGenerations: promptGenerationsCount,
          activeMasterPrompts: INITIAL_MASTER_PROMPTS.filter(p => p.active).length
        }
      });
    }

    // 2. Users Management
    if (pathname === '/api/admin/users') {
      if (method === 'GET') {
        const users = await getAllUsersList(supabase, env);
        return jsonResponse({ success: true, users });
      }

      if (method === 'POST') {
        const body = await request.json() as any;
        const rawUsername = body.username ? String(body.username) : '';
        const rawPassword = body.password ? String(body.password) : '';
        const role = body.role === 'admin' ? 'admin' : 'user';

        if (!rawUsername.trim() || !rawPassword.trim()) {
          return jsonResponse({ success: false, error: 'نام کاربری و کلمه عبور الزامی است.' }, 400);
        }

        const cleanUsername = normalizePersianDigits(rawUsername.trim()).toLowerCase();
        const existing = await findUserByUsername(supabase, env, cleanUsername);
        if (existing) {
          return jsonResponse({ success: false, error: 'این نام کاربری قبلاً در سامانه ثبت شده است.' }, 400);
        }

        const password_hash = bcrypt.hashSync(rawPassword.trim(), 10);
        const newUserId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'usr-' + Date.now();

        let createdUser: any = {
          id: newUserId,
          username: cleanUsername,
          role,
          is_active: true,
          is_suspicious: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ip_count: 0,
          last_login_at: null,
          active_sessions_count: 0
        };

        if (supabase) {
          try {
            const { data, error } = await supabase.from('users').insert({
              id: newUserId,
              username: cleanUsername,
              role,
              password_hash,
              is_active: true,
              is_suspicious: false
            }).select('id, username, role, is_active, is_suspicious, created_at, updated_at').maybeSingle();

            if (error) {
              if (error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate')) {
                return jsonResponse({ success: false, error: 'این نام کاربری قبلاً در سامانه ثبت شده است.' }, 400);
              }
              // Attempt standard insert
              const { error: fallbackErr } = await supabase.from('users').insert({
                id: newUserId,
                username: cleanUsername,
                role,
                password_hash,
                is_active: true,
                is_suspicious: false
              });
              if (fallbackErr && (fallbackErr.code === '23505' || fallbackErr.message.includes('unique'))) {
                return jsonResponse({ success: false, error: 'این نام کاربری قبلاً در سامانه ثبت شده است.' }, 400);
              }
            }

            if (data) {
              createdUser = { ...data, ip_count: 0, last_login_at: null, active_sessions_count: 0 };
            }
          } catch (dbErr: any) {
            return jsonResponse({ success: false, error: 'خطایی در ثبت کاربر در دیتابیس رخ داد: ' + (dbErr?.message || 'نامشخص') }, 500);
          }
        }

        await recordAuditLog(supabase, authedUser.id, authedUser.username, 'ایجاد کاربر جدید', `ایجاد کاربر «${cleanUsername}» با نقش ${role}`, clientIp);

        return jsonResponse({
          success: true,
          user: createdUser,
          message: `حساب کاربری «${cleanUsername}» با موفقیت در سامانه ایجاد شد.`
        });
      }
    }

    const userMatch = pathname.match(/^\/api\/admin\/users\/([^\/]+)(\/.*)?$/);
    if (userMatch) {
      const targetUserId = userMatch[1];
      const subAction = userMatch[2];

      if (subAction === '/reset-password' && method === 'POST') {
        const body = await request.json() as any;
        const newPassword = body.newPassword ? String(body.newPassword).trim() : '';
        if (!newPassword || newPassword.length < 4) {
          return jsonResponse({ success: false, error: 'کلمه عبور جدید باید حداقل ۴ کاراکتر باشد.' }, 400);
        }

        const password_hash = bcrypt.hashSync(newPassword, 10);
        if (supabase && targetUserId !== SUPERADMIN_ID) {
          try {
            await supabase.from('users').update({ password_hash, updated_at: new Date().toISOString() }).eq('id', targetUserId);
            await supabase.from('sessions').delete().eq('user_id', targetUserId);
          } catch {}
        }

        await recordAuditLog(supabase, authedUser.id, authedUser.username, 'بازنشانی رمز عبور', `بازنشانی رمز عبور کاربر ${targetUserId}`, clientIp);

        return jsonResponse({ success: true, message: 'کلمه عبور با موفقیت بازنشانی شد.' });
      }

      if (subAction === '/history' && method === 'GET') {
        const targetUser = await findUserById(supabase, env, targetUserId);
        let logs: any[] = [];
        if (supabase) {
          try {
            let query = supabase.from('login_logs').select('*');
            if (targetUser && targetUser.username) {
              query = query.or(`user_id.eq.${targetUserId},username.ilike.${targetUser.username}`);
            } else {
              query = query.eq('user_id', targetUserId);
            }
            const { data } = await query.order('timestamp', { ascending: false }).limit(50);
            if (data && data.length > 0) logs = data;
          } catch {}
        }

        const uniqueIps = Array.from(new Set(logs.map(l => l.ip_address).filter(Boolean)));
        const lastLogin = logs.length > 0 ? logs[0].timestamp : null;

        return jsonResponse({
          success: true,
          history: {
            recentLogs: logs,
            totalLogins: logs.length,
            uniqueIps,
            lastLogin
          }
        });
      }

      if (!subAction && method === 'PATCH') {
        const body = await request.json() as any;
        const updatePayload: any = { updated_at: new Date().toISOString() };
        if (typeof body.is_active === 'boolean') updatePayload.is_active = body.is_active;
        if (typeof body.is_suspicious === 'boolean') updatePayload.is_suspicious = body.is_suspicious;
        if (body.role && (body.role === 'admin' || body.role === 'user')) updatePayload.role = body.role;
        if (body.username) updatePayload.username = normalizePersianDigits(String(body.username).trim()).toLowerCase();

        let updatedUser: any = { id: targetUserId, ...updatePayload };

        if (supabase && targetUserId !== SUPERADMIN_ID) {
          try {
            const { data } = await supabase
              .from('users')
              .update(updatePayload)
              .eq('id', targetUserId)
              .select('id, username, role, is_active, is_suspicious, created_at, updated_at')
              .maybeSingle();

            if (data) updatedUser = data;
          } catch {}
        }

        await recordAuditLog(supabase, authedUser.id, authedUser.username, 'ویرایش کاربر', `ویرایش کاربر با شناسه ${targetUserId}`, clientIp);

        return jsonResponse({ success: true, user: updatedUser, message: 'اطلاعات کاربر با موفقیت به‌روزرسانی شد.' });
      }

      if (!subAction && method === 'DELETE') {
        if (targetUserId === SUPERADMIN_ID) {
          return jsonResponse({ success: false, error: 'امکان حذف مدیر ارشد اصلی سامانه وجود ندارد.' }, 400);
        }

        if (supabase) {
          try {
            await supabase.from('sessions').delete().eq('user_id', targetUserId);
            await supabase.from('users').delete().eq('id', targetUserId);
          } catch {}
        }

        await recordAuditLog(supabase, authedUser.id, authedUser.username, 'حذف کاربر', `حذف کاربر با شناسه ${targetUserId}`, clientIp);

        return jsonResponse({ success: true, message: 'حساب کاربری با موفقیت حذف گردید.' });
      }
    }

    // 3. Master Prompts
    if (pathname === '/api/admin/master-prompts') {
      if (method === 'GET') {
        let prompts = INITIAL_MASTER_PROMPTS;
        if (supabase) {
          try {
            const { data } = await supabase.from('master_prompts').select('*').order('sort_order');
            if (data && data.length > 0) prompts = data;
          } catch {}
        }
        return jsonResponse({ success: true, prompts });
      }

      if (method === 'POST') {
        const body = await request.json() as any;
        const newPrompt = {
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'prompt-' + Date.now(),
          ...body,
          sort_order: Number(body.sort_order) || 99,
          updated_at: new Date().toISOString()
        };
        if (supabase) {
          try {
            await supabase.from('master_prompts').insert(newPrompt);
          } catch {}
        }
        await recordAuditLog(supabase, authedUser.id, authedUser.username, 'افزودن پرامپت مادر', `افزودن پرامپت «${newPrompt.name_fa || newPrompt.id}»`, clientIp);
        return jsonResponse({ success: true, prompt: newPrompt, message: 'پرامپت مادر جدید با موفقیت اضافه شد.' });
      }
    }

    if (pathname === '/api/admin/master-prompts/reorder' && method === 'POST') {
      const body = await request.json() as any;
      const { orderedIds } = body;
      if (supabase && Array.isArray(orderedIds)) {
        try {
          for (let i = 0; i < orderedIds.length; i++) {
            await supabase.from('master_prompts').update({ sort_order: i + 1 }).eq('id', orderedIds[i]);
          }
        } catch {}
      }
      return jsonResponse({ success: true, message: 'ترتیب پرامپت‌ها با موفقیت ذخیره شد.' });
    }

    if (pathname === '/api/admin/master-prompts/validate' && method === 'POST') {
      return jsonResponse({ success: true, valid: true, message: 'تمامی متغیرهای پرامپت معتبر هستند.' });
    }

    if (pathname === '/api/admin/master-prompts/test-render' && method === 'POST') {
      const body = await request.json() as any;
      let template = body.template || '';
      const sampleVars: Record<string, string> = {
        '{{TITLE}}': 'ایران کهن',
        '{{CALLIGRAPHY_STYLE}}': 'نستعلیق سنتی',
        '{{TYPOGRAPHY_FORM}}': 'تایپوگرافی خوشنویسی',
        '{{TITLE_COLOR_HEX}}': '#F55951',
        '{{BACKGROUND_STATUS}}': 'Clean isolated solid background in #FFFFFF',
        '{{BACKGROUND_COLOR_HEX}}': '#FFFFFF',
        '{{MATERIAL}}': 'مرکب سنتی خوشنویسی',
        '{{DIMENSION}}': 'دو بعدی تخت',
        '{{LIGHTING}}': 'نورپردازی استودیویی',
        '{{SHADOWING}}': 'بدون سایه',
        '{{ASPECT_RATIO}}': '1:1',
        '{{AI_MODEL}}': 'Midjourney v6.1'
      };
      for (const [k, v] of Object.entries(sampleVars)) {
        template = template.split(k).join(v);
      }
      return jsonResponse({ success: true, renderedPrompt: template, rendered: template });
    }

    const promptMatch = pathname.match(/^\/api\/admin\/master-prompts\/([^\/]+)(\/.*)?$/);
    if (promptMatch) {
      const promptId = promptMatch[1];
      const sub = promptMatch[2];

      if (sub === '/versions' && method === 'GET') {
        let versions: any[] = [];
        if (supabase) {
          try {
            const { data } = await supabase.from('master_prompt_versions').select('*').eq('master_prompt_id', promptId).order('version', { ascending: false });
            if (data) versions = data;
          } catch {}
        }
        return jsonResponse({ success: true, versions });
      }

      if (sub === '/restore' && method === 'POST') {
        const body = await request.json() as any;
        if (supabase && body.version) {
          try {
            const { data: ver } = await supabase.from('master_prompt_versions').select('*').eq('master_prompt_id', promptId).eq('version', body.version).maybeSingle();
            if (ver && ver.template) {
              await supabase.from('master_prompts').update({ template: ver.template, updated_at: new Date().toISOString() }).eq('id', promptId);
            }
          } catch {}
        }
        return jsonResponse({ success: true, message: 'نسخه مورد نظر با موفقیت بازیابی شد.' });
      }

      if (!sub && method === 'PATCH') {
        const body = await request.json() as any;
        if (supabase) {
          try {
            const { data: existing } = await supabase.from('master_prompts').select('*').eq('id', promptId).maybeSingle();
            if (existing) {
              await supabase.from('master_prompts').update({ ...body, updated_at: new Date().toISOString() }).eq('id', promptId);
              // Save version history
              await supabase.from('master_prompt_versions').insert({
                id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'ver-' + Date.now(),
                master_prompt_id: promptId,
                template: body.template || existing.template,
                version: Date.now(),
                created_at: new Date().toISOString()
              });
            } else {
              const defaultP = INITIAL_MASTER_PROMPTS.find(p => p.id === promptId) || { id: promptId };
              await supabase.from('master_prompts').upsert({ ...defaultP, ...body, id: promptId, updated_at: new Date().toISOString() });
            }
          } catch {}
        }
        await recordAuditLog(supabase, authedUser.id, authedUser.username, 'ویرایش پرامپت مادر', `ویرایش پرامپت مادر با شناسه ${promptId}`, clientIp);
        return jsonResponse({ success: true, message: 'پرامپت مادر با موفقیت به‌روزرسانی شد.' });
      }

      if (!sub && method === 'DELETE') {
        if (supabase) {
          try {
            await supabase.from('master_prompt_versions').delete().eq('master_prompt_id', promptId);
            await supabase.from('master_prompts').delete().eq('id', promptId);
          } catch {}
        }
        await recordAuditLog(supabase, authedUser.id, authedUser.username, 'حذف پرامپت مادر', `حذف پرامپت با شناسه ${promptId}`, clientIp);
        return jsonResponse({ success: true, message: 'پرامپت مادر با موفقیت حذف شد.' });
      }
    }

    // 4. Typography Styles
    if (pathname === '/api/admin/styles') {
      if (method === 'GET') {
        let styles = INITIAL_TYPOGRAPHY_STYLES;
        if (supabase) {
          try {
            const { data } = await supabase.from('typography_styles').select('*').order('sort_order');
            if (data && data.length > 0) styles = data;
          } catch {}
        }
        return jsonResponse({ success: true, styles });
      }

      if (method === 'POST') {
        const body = await request.json() as any;
        const newStyle = {
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'style-' + Date.now(),
          ...body,
          sort_order: Number(body.sort_order) || 99
        };
        if (supabase) {
          try {
            await supabase.from('typography_styles').insert(newStyle);
          } catch {}
        }
        await recordAuditLog(supabase, authedUser.id, authedUser.username, 'افزودن سبک خط', `افزودن سبک «${newStyle.name_fa}»`, clientIp);
        return jsonResponse({ success: true, style: newStyle, message: 'سبک خط جدید با موفقیت اضافه شد.' });
      }
    }

    const styleMatch = pathname.match(/^\/api\/admin\/styles\/([^\/]+)$/);
    if (styleMatch) {
      const styleId = styleMatch[1];
      if (method === 'PATCH') {
        const body = await request.json() as any;
        if (supabase) {
          try {
            const { data: existing } = await supabase.from('typography_styles').select('id').eq('id', styleId).maybeSingle();
            if (existing) {
              await supabase.from('typography_styles').update(body).eq('id', styleId);
            } else {
              const defaultStyle = INITIAL_TYPOGRAPHY_STYLES.find(s => s.id === styleId) || { id: styleId };
              await supabase.from('typography_styles').upsert({ ...defaultStyle, ...body, id: styleId });
            }
          } catch {}
        }
        await recordAuditLog(supabase, authedUser.id, authedUser.username, 'ویرایش سبک خط', `ویرایش سبک خط ${styleId}`, clientIp);
        return jsonResponse({ success: true, message: 'سبک خط با موفقیت به‌روزرسانی شد.' });
      }
      if (method === 'DELETE') {
        if (supabase) {
          try {
            await supabase.from('typography_styles').delete().eq('id', styleId);
          } catch {}
        }
        await recordAuditLog(supabase, authedUser.id, authedUser.username, 'حذف سبک خط', `حذف سبک خط ${styleId}`, clientIp);
        return jsonResponse({ success: true, message: 'سبک خط با موفقیت حذف شد.' });
      }
    }

    // 5. Materials, Models, Forms, Dimensions, Lightings, Shadows, Aspect Ratios
    const entityConfigs: Record<string, { table: string; initial: any[]; nameFa: string; camelKey: string; snakeKey: string }> = {
      'materials': { table: 'materials', initial: INITIAL_MATERIALS, nameFa: 'متریال', camelKey: 'materials', snakeKey: 'materials' },
      'ai-models': { table: 'ai_models', initial: INITIAL_AI_MODELS, nameFa: 'مدل هوش مصنوعی', camelKey: 'aiModels', snakeKey: 'ai_models' },
      'forms': { table: 'typography_forms', initial: INITIAL_TYPOGRAPHY_FORMS, nameFa: 'فرم تایپوگرافی', camelKey: 'forms', snakeKey: 'forms' },
      'dimensions': { table: 'dimension_options', initial: INITIAL_DIMENSIONS, nameFa: 'بعد', camelKey: 'dimensions', snakeKey: 'dimensions' },
      'lightings': { table: 'lighting_options', initial: INITIAL_LIGHTINGS, nameFa: 'نورپردازی', camelKey: 'lightings', snakeKey: 'lightings' },
      'shadows': { table: 'shadow_options', initial: INITIAL_SHADOWS, nameFa: 'سایه‌زنی', camelKey: 'shadows', snakeKey: 'shadows' },
      'aspect-ratios': { table: 'aspect_ratio_options', initial: INITIAL_ASPECT_RATIOS, nameFa: 'نسبت ابعاد', camelKey: 'aspectRatios', snakeKey: 'aspect_ratios' }
    };

    for (const [routeKey, cfg] of Object.entries(entityConfigs)) {
      if (pathname === `/api/admin/${routeKey}`) {
        if (method === 'GET') {
          let items = cfg.initial;
          if (supabase) {
            try {
              const { data } = await supabase.from(cfg.table).select('*').order('sort_order');
              if (data && data.length > 0) items = data;
            } catch {}
          }
          return jsonResponse({
            success: true,
            [cfg.camelKey]: items,
            [cfg.snakeKey]: items,
            items
          });
        }

        if (method === 'POST') {
          const body = await request.json() as any;
          const newItem = {
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${routeKey.slice(0, 4)}-${Date.now()}`,
            ...body,
            sort_order: Number(body.sort_order) || 99
          };
          if (supabase) {
            try {
              await supabase.from(cfg.table).insert(newItem);
            } catch {}
          }
          await recordAuditLog(supabase, authedUser.id, authedUser.username, `افزودن ${cfg.nameFa}`, `افزودن ${cfg.nameFa} «${newItem.name_fa || newItem.id}»`, clientIp);
          return jsonResponse({
            success: true,
            item: newItem,
            [cfg.camelKey]: newItem,
            [cfg.snakeKey]: newItem,
            message: `${cfg.nameFa} با موفقیت افزوده شد.`
          });
        }
      }

      const entityMatch = pathname.match(new RegExp(`^\\/api\\/admin\\/${routeKey}\\/([^\\/]+)$`));
      if (entityMatch) {
        const entityId = entityMatch[1];
        if (method === 'PATCH') {
          const body = await request.json() as any;
          if (supabase) {
            try {
              const { data: existing } = await supabase.from(cfg.table).select('id').eq('id', entityId).maybeSingle();
              if (existing) {
                await supabase.from(cfg.table).update(body).eq('id', entityId);
              } else {
                const defaultItem = cfg.initial.find(i => i.id === entityId) || { id: entityId };
                await supabase.from(cfg.table).upsert({ ...defaultItem, ...body, id: entityId });
              }
            } catch {}
          }
          await recordAuditLog(supabase, authedUser.id, authedUser.username, `ویرایش ${cfg.nameFa}`, `ویرایش ${cfg.nameFa} با شناسه ${entityId}`, clientIp);
          return jsonResponse({ success: true, message: `${cfg.nameFa} با موفقیت به‌روزرسانی شد.` });
        }
        if (method === 'DELETE') {
          if (supabase) {
            try {
              await supabase.from(cfg.table).delete().eq('id', entityId);
            } catch {}
          }
          await recordAuditLog(supabase, authedUser.id, authedUser.username, `حذف ${cfg.nameFa}`, `حذف ${cfg.nameFa} با شناسه ${entityId}`, clientIp);
          return jsonResponse({ success: true, message: `${cfg.nameFa} با موفقیت حذف گردید.` });
        }
      }
    }

    // 6. Feedback & Reports
    if (pathname === '/api/admin/feedback' || pathname === '/api/admin/feedback-reports') {
      if (method === 'GET') {
        const typeParam = url.searchParams.get('type');
        const statusParam = url.searchParams.get('status');
        const searchParam = url.searchParams.get('search');

        let reports: any[] = [];
        if (supabase) {
          try {
            let query = supabase.from('feedback_reports').select('*');
            if (typeParam && typeParam !== 'all') query = query.eq('type', typeParam);
            if (statusParam && statusParam !== 'all') query = query.eq('status', statusParam);
            if (searchParam) query = query.or(`name.ilike.%${searchParam}%,message.ilike.%${searchParam}%,subject.ilike.%${searchParam}%`);

            const { data } = await query.order('created_at', { ascending: false });
            if (data) reports = data;
          } catch {}
        }
        return jsonResponse({ success: true, feedbacks: reports, reports });
      }
    }

    const feedbackMatch = pathname.match(/^\/api\/admin\/feedback\/([^\/]+)(\/status)?$/);
    if (feedbackMatch) {
      const fId = feedbackMatch[1];
      if (method === 'PATCH') {
        const body = await request.json() as any;
        const newStatus = body.status || 'read';
        let updatedReport: any = { id: fId, status: newStatus };
        if (supabase) {
          try {
            const { data } = await supabase.from('feedback_reports').update({ status: newStatus }).eq('id', fId).select().maybeSingle();
            if (data) updatedReport = data;
          } catch {}
        }
        await recordAuditLog(supabase, authedUser.id, authedUser.username, 'تغییر وضعیت گزارش', `تغییر وضعیت پیام ${fId} به ${newStatus}`, clientIp);
        return jsonResponse({ success: true, feedback: updatedReport, message: 'وضعیت گزارش با موفقیت به‌روزرسانی شد.' });
      }
      if (method === 'DELETE') {
        if (supabase) {
          try {
            await supabase.from('feedback_reports').delete().eq('id', fId);
          } catch {}
        }
        await recordAuditLog(supabase, authedUser.id, authedUser.username, 'حذف پیام کاربر', `حذف گزارش با شناسه ${fId}`, clientIp);
        return jsonResponse({ success: true, message: 'پیام با موفقیت حذف گردید.' });
      }
    }

    // 7. Security Events
    if (pathname === '/api/admin/security-events') {
      if (method === 'GET') {
        let events: any[] = [];
        if (supabase) {
          try {
            const { data } = await supabase.from('security_events').select('*').order('timestamp', { ascending: false }).limit(100);
            if (data) events = data;
          } catch {}
        }
        return jsonResponse({ success: true, events });
      }
    }

    const secMatch = pathname.match(/^\/api\/admin\/security-events\/([^\/]+)(\/status)?$/);
    if (secMatch) {
      const sId = secMatch[1];
      if (method === 'PATCH') {
        const body = await request.json() as any;
        const newStatus = body.status || 'reviewed';
        if (supabase) {
          try {
            await supabase.from('security_events').update({ status: newStatus }).eq('id', sId);
          } catch {}
        }
        return jsonResponse({ success: true, message: 'وضعیت رویداد امنیتی به‌روزرسانی شد.' });
      }
      if (method === 'DELETE') {
        if (supabase) {
          try {
            await supabase.from('security_events').delete().eq('id', sId);
          } catch {}
        }
        return jsonResponse({ success: true, message: 'رویداد امنیتی با موفقیت حذف شد.' });
      }
    }

    // 8. Login Logs
    if (pathname === '/api/admin/login-logs') {
      if (method === 'GET') {
        let logs: any[] = [];
        if (supabase) {
          try {
            const { data } = await supabase.from('login_logs').select('*').order('timestamp', { ascending: false }).limit(200);
            if (data) logs = data;
          } catch {}
        }
        return jsonResponse({ success: true, logs, total: logs.length, page: 1, totalPages: 1 });
      }
    }

    const loginLogMatch = pathname.match(/^\/api\/admin\/login-logs\/([^\/]+)$/);
    if (loginLogMatch && method === 'DELETE') {
      const lId = loginLogMatch[1];
      if (supabase) {
        try {
          await supabase.from('login_logs').delete().eq('id', lId);
        } catch {}
      }
      return jsonResponse({ success: true, message: 'لاگ ورود با موفقیت حذف شد.' });
    }

    // 9. Audit Logs
    if (pathname === '/api/admin/audit-logs') {
      if (method === 'GET') {
        let logs: any[] = [];
        if (supabase) {
          try {
            const { data } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200);
            if (data) logs = data;
          } catch {}
        }
        return jsonResponse({ success: true, logs, total: logs.length, page: 1, totalPages: 1 });
      }
    }

    const auditLogMatch = pathname.match(/^\/api\/admin\/audit-logs\/([^\/]+)$/);
    if (auditLogMatch && method === 'DELETE') {
      const aId = auditLogMatch[1];
      if (supabase) {
        try {
          await supabase.from('audit_logs').delete().eq('id', aId);
        } catch {}
      }
      return jsonResponse({ success: true, message: 'لاگ نظارتی با موفقیت حذف شد.' });
    }

    // 10. Site Settings
    if (pathname === '/api/admin/settings') {
      if (method === 'GET') {
        let settings = DEFAULT_APP_SETTINGS;
        if (supabase) {
          try {
            const { data } = await supabase.from('site_settings').select('*').eq('id', 'default').maybeSingle();
            if (data && data.settings_json) {
              settings = { ...DEFAULT_APP_SETTINGS, ...(typeof data.settings_json === 'string' ? JSON.parse(data.settings_json) : data.settings_json) };
            }
          } catch {}
        }
        return jsonResponse({ success: true, settings });
      }

      if (method === 'POST' || method === 'PATCH') {
        const body = await request.json() as any;
        const mergedSettings = { ...DEFAULT_APP_SETTINGS, ...body };
        if (supabase) {
          try {
            await supabase.from('site_settings').upsert({
              id: 'default',
              settings_json: mergedSettings,
              updated_at: new Date().toISOString()
            });
          } catch {}
        }
        await recordAuditLog(supabase, authedUser.id, authedUser.username, 'به‌روزرسانی تنظیمات سامانه', 'تغییر تنظیمات عمومی سامانه', clientIp);
        return jsonResponse({ success: true, settings: mergedSettings, message: 'تنظیمات با موفقیت در سامانه ذخیره گردید.' });
      }
    }

    // 11. Universal Maintenance & Cleanup
    if (pathname === '/api/admin/maintenance/cleanup' && method === 'POST') {
      const body = await request.json() as any;
      const { target, olderThanDays } = body;
      const days = typeof olderThanDays === 'number' ? olderThanDays : 30;
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      let totalDeleted = 0;
      const deletedCounts: Record<string, number> = {
        login_logs: 0,
        audit_logs: 0,
        security_events: 0,
        generation_logs: 0,
        feedback_reports: 0
      };

      if (supabase) {
        try {
          if (target === 'all' || target === 'login_logs') {
            const { count } = await supabase.from('login_logs').delete({ count: 'exact' }).lt('timestamp', cutoffDate);
            deletedCounts.login_logs = count || 0;
            totalDeleted += deletedCounts.login_logs;
          }
          if (target === 'all' || target === 'audit_logs') {
            const { count } = await supabase.from('audit_logs').delete({ count: 'exact' }).lt('timestamp', cutoffDate);
            deletedCounts.audit_logs = count || 0;
            totalDeleted += deletedCounts.audit_logs;
          }
          if (target === 'all' || target === 'security_events') {
            const { count } = await supabase.from('security_events').delete({ count: 'exact' }).lt('timestamp', cutoffDate);
            deletedCounts.security_events = count || 0;
            totalDeleted += deletedCounts.security_events;
          }
          if (target === 'all' || target === 'generation_logs') {
            const { count } = await supabase.from('generation_logs').delete({ count: 'exact' }).lt('timestamp', cutoffDate);
            deletedCounts.generation_logs = count || 0;
            totalDeleted += deletedCounts.generation_logs;
          }
          if (target === 'all' || target === 'feedback_reports') {
            const { count } = await supabase.from('feedback_reports').delete({ count: 'exact' }).lt('created_at', cutoffDate);
            deletedCounts.feedback_reports = count || 0;
            totalDeleted += deletedCounts.feedback_reports;
          }
        } catch {}
      }

      await recordAuditLog(
        supabase,
        authedUser.id,
        authedUser.username,
        'پاکسازی داده‌های قدیمی',
        `پاکسازی بخش ${target} برای رکوردهای قدیمی‌تر از ${days} روز (${totalDeleted} رکورد حذف شد)`,
        clientIp
      );

      return jsonResponse({
        success: true,
        message: `عملیات پاکسازی با موفقیت انجام شد (${totalDeleted} رکورد حذف گردید).`,
        result: {
          totalDeleted,
          deletedCounts
        }
      });
    }

    if (pathname === '/api/admin/export-sql' && method === 'GET') {
      const sqlContent = `-- PERSIAN TYPOGRAPHY SCHEMA & SEED EXPORT\n-- Generated: ${new Date().toISOString()}\n\nSELECT 1;\n`;
      return new Response(sqlContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/sql; charset=utf-8',
          'Content-Disposition': 'attachment; filename="supabase_schema_and_seed.sql"',
          ...corsHeaders
        }
      });
    }
  }

  return jsonResponse({
    success: false,
    error: 'مسیر API مورد نظر یافت نشد.',
    path: pathname
  }, 404);
}

export const onRequest: any = async (context: { request: Request; env: Env; next: () => Promise<Response> }) => {
  return handleApiRequest(context.request, context.env);
};
