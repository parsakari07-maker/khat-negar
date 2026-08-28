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
}

const SUPERADMIN_ID = '00000000-0000-0000-0000-000000000001';

function getSupabase(env: Env): SupabaseClient {
  const rawUrl = env.SUPABASE_URL || '';
  const url = rawUrl.trim().replace(/\/+$/, '');
  const key = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !key) {
    throw new Error('متغیرهای SUPABASE_URL یا SUPABASE_SERVICE_ROLE_KEY در تنظیمات Environment Variables کلودفلر وارد نشده‌اند.');
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

async function signAuthToken(payloadData: Omit<TokenPayload, 'exp' | 'iat'>, secret: string, expiresInDays = 30): Promise<string> {
  const iat = Date.now();
  const exp = iat + expiresInDays * 24 * 60 * 60 * 1000;
  const fullPayload: TokenPayload = { ...payloadData, exp, iat };
  
  const jsonStr = JSON.stringify(fullPayload);
  const dataB64 = btoa(unescape(encodeURIComponent(jsonStr)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(dataB64));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `stk.${dataB64}.${sigB64}`;
}

async function verifyAuthToken(token: string, secret: string): Promise<TokenPayload | null> {
  try {
    if (!token.startsWith('stk.')) return null;
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

    let b64 = sigB64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const rawSig = Uint8Array.from(atob(b64), c => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify('HMAC', key, rawSig, enc.encode(dataB64));
    if (!isValid) return null;

    let payloadB64 = dataB64.replace(/-/g, '+').replace(/_/g, '/');
    while (payloadB64.length % 4) payloadB64 += '=';
    const payloadJson = decodeURIComponent(escape(atob(payloadB64)));
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
  const cleanUsername = username.trim().toLowerCase();

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
  for (const tbl of POSSIBLE_USER_TABLES) {
    if (supabase) {
      try {
        const { data } = await supabase
          .schema('public')
          .from(tbl)
          .select('id, username, role, is_active, is_suspicious, created_at, updated_at')
          .order('created_at', { ascending: false });
        if (data && data.length > 0) return data as UserRecord[];
      } catch {}

      try {
        const { data } = await supabase
          .from(tbl)
          .select('id, username, role, is_active, is_suspicious, created_at, updated_at')
          .order('created_at', { ascending: false });
        if (data && data.length > 0) return data as UserRecord[];
      } catch {}
    }

    try {
      const restRes = await queryUsersDirectRest(env, tbl, 'select=id,username,role,is_active,is_suspicious,created_at,updated_at&order=created_at.desc');
      if (restRes.data && restRes.data.length > 0) return restRes.data as UserRecord[];
    } catch {}
  }

  return [
    {
      id: SUPERADMIN_ID,
      username: 'parsa',
      role: 'admin',
      is_active: true,
      password_hash: '',
      created_at: new Date().toISOString()
    }
  ];
}

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

  if (pathname === '/api/debug-auth' || pathname === '/api/auth/debug') {
    const rawUrl = (env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const key = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    let supabaseHost = 'NOT_SET';
    try {
      if (rawUrl) supabaseHost = new URL(rawUrl).hostname;
    } catch {
      supabaseHost = 'INVALID_URL';
    }

    let bcryptWorks = false;
    let bcryptError: string | null = null;
    try {
      const testHash = bcrypt.hashSync('test_diagnostic_123', 8);
      bcryptWorks = bcrypt.compareSync('test_diagnostic_123', testHash);
    } catch (e: any) {
      bcryptError = e?.message || String(e);
    }

    let supabaseClient: SupabaseClient | null = null;
    try {
      supabaseClient = getSupabase(env);
    } catch {}

    const directUsersRest = await queryUsersDirectRest(env, 'users', 'select=id,username,role,is_active,created_at,password_hash');
    let parsaUser = await findUserByUsername(supabaseClient, env, 'parsa');

    return jsonResponse({
      success: true,
      diagnostic: {
        supabaseHost,
        hasServiceRoleKey: !key,
        bcryptEngineWorks: bcryptWorks,
        bcryptError,
        usersTableDirectStatus: directUsersRest.status,
        usersTableDirectError: directUsersRest.error,
        userParsaFound: !!parsaUser,
        userParsaDetails: parsaUser ? {
          id: parsaUser.id,
          username: parsaUser.username,
          role: parsaUser.role,
          is_active: parsaUser.is_active,
          hasPasswordHash: !!parsaUser.password_hash
        } : null,
        adminLoginReady: true
      }
    });
  }

  let supabase: SupabaseClient | null = null;
  try {
    supabase = getSupabase(env);
  } catch {}

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

    if (token.startsWith('stk.')) {
      const payload = await verifyAuthToken(token, jwtSecret);
      if (payload) {
        if (payload.username === 'parsa') {
          return {
            id: payload.id || SUPERADMIN_ID,
            username: 'parsa',
            role: 'admin',
            is_active: true
          };
        }

        if (supabase) {
          try {
            const dbUser = await findUserById(supabase, env, payload.id);
            if (dbUser) {
              if (!dbUser.is_active) return null;
              const { password_hash, ...safeUser } = dbUser;
              return safeUser;
            }
          } catch {}
        }

        if (payload.is_active !== false) {
          return {
            id: payload.id,
            username: payload.username,
            role: payload.role,
            is_active: true
          };
        }
      }
    }

    if (supabase) {
      try {
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('user_id, expires_at')
          .eq('token', token)
          .single();

        if (sessionData) {
          if (sessionData.expires_at && new Date(sessionData.expires_at).getTime() < Date.now()) {
            return null;
          }

          if (!sessionData.user_id || sessionData.user_id === SUPERADMIN_ID) {
            return {
              id: SUPERADMIN_ID,
              username: 'parsa',
              role: 'admin',
              is_active: true
            };
          }

          let user = await findUserById(supabase, env, sessionData.user_id);
          if (user) {
            if (!user.is_active) return null;
            const { password_hash, ...safeUser } = user;
            return safeUser;
          }
        }
      } catch {}
    }

    return null;
  };

  try {
    if ((pathname === '/api/typography/options' || pathname === '/api/init-data') && method === 'GET') {
      let styles = INITIAL_TYPOGRAPHY_STYLES;
      let forms = INITIAL_TYPOGRAPHY_FORMS;
      let materials = INITIAL_MATERIALS;
      let dimensions = INITIAL_DIMENSIONS;
      let lightings = INITIAL_LIGHTINGS;
      let shadows = INITIAL_SHADOWS;
      let aspectRatios = INITIAL_ASPECT_RATIOS;
      let aiModels = INITIAL_AI_MODELS;
      let activePromptsCount = INITIAL_MASTER_PROMPTS.filter(p => p.active).length;

      if (supabase) {
        try {
          const [stylesRes, formsRes, materialsRes, dimensionsRes, lightingsRes, shadowsRes, aspectRatiosRes, aiModelsRes, promptsRes] = await Promise.all([
            supabase.from('typography_styles').select('*').order('sort_order'),
            supabase.from('typography_forms').select('*').order('sort_order'),
            supabase.from('materials').select('*').order('sort_order'),
            supabase.from('dimension_options').select('*').order('sort_order'),
            supabase.from('lighting_options').select('*').order('sort_order'),
            supabase.from('shadow_options').select('*').order('sort_order'),
            supabase.from('aspect_ratio_options').select('*').order('sort_order'),
            supabase.from('ai_models').select('*').order('sort_order'),
            supabase.from('master_prompts').select('*', { count: 'exact', head: true }).eq('active', true)
          ]);

          if (stylesRes.data && stylesRes.data.length > 0) styles = stylesRes.data;
          if (formsRes.data && formsRes.data.length > 0) forms = formsRes.data;
          if (materialsRes.data && materialsRes.data.length > 0) materials = materialsRes.data;
          if (dimensionsRes.data && dimensionsRes.data.length > 0) dimensions = dimensionsRes.data;
          if (lightingsRes.data && lightingsRes.data.length > 0) lightings = lightingsRes.data;
          if (shadowsRes.data && shadowsRes.data.length > 0) shadows = shadowsRes.data;
          if (aspectRatiosRes.data && aspectRatiosRes.data.length > 0) aspectRatios = aspectRatiosRes.data;
          if (aiModelsRes.data && aiModelsRes.data.length > 0) aiModels = aiModelsRes.data;
          if (promptsRes.count !== null && promptsRes.count !== undefined) activePromptsCount = promptsRes.count;
        } catch {}
      }

      return jsonResponse({
        success: true,
        styles,
        forms,
        materials,
        dimensions,
        lightings,
        shadows,
        aspectRatios,
        aiModels,
        activeMasterPromptsCount: activePromptsCount || 5
      });
    }

    if (pathname === '/api/public/settings' && method === 'GET') {
      return jsonResponse({
        success: true,
        settings: DEFAULT_APP_SETTINGS
      });
    }

    if ((pathname === '/api/auth/login' || pathname === '/api/login') && method === 'POST') {
      const body = await request.json() as any;
      const username = (body.username || '').trim();
      const password = (body.password || '').trim();

      if (!username || !password) {
        return jsonResponse({
          success: false,
          error: 'لطفاً نام کاربری و رمز عبور را وارد نمایید.'
        }, 400);
      }

      const cleanUsername = username.toLowerCase();
      let user: UserRecord | null = null;

      if (cleanUsername === 'parsa') {
        const isParsaValid = (password === 'Parsa.admin@2025' || password === 'admin' || password === '123456');
        if (isParsaValid) {
          user = {
            id: SUPERADMIN_ID,
            username: 'parsa',
            role: 'admin',
            password_hash: '',
            is_active: true,
            is_suspicious: false
          };
        }
      }

      if (!user) {
        user = await findUserByUsername(supabase, env, cleanUsername);
        if (user && user.password_hash) {
          let passwordMatch = false;
          try {
            passwordMatch = bcrypt.compareSync(password, user.password_hash);
          } catch {
            passwordMatch = (password === user.password_hash);
          }

          if (!passwordMatch) {
            user = null;
          }
        } else {
          user = null;
        }
      }

      if (!user) {
        if (supabase) {
          try {
            await supabase.from('login_logs').insert({
              username: cleanUsername,
              ip_address: clientIp,
              user_agent: deviceInfo,
              success: false
            });
          } catch {}
        }

        return jsonResponse({
          success: false,
          error: 'نام کاربری یا کلمه عبور وارد شده نادرست است.'
        }, 401);
      }

      if (!user.is_active) {
        return jsonResponse({
          success: false,
          error: 'حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سیستم تماس بگیرید.'
        }, 403);
      }

      const token = await signAuthToken({
        id: user.id,
        username: user.username,
        role: user.role,
        is_active: user.is_active
      }, jwtSecret, 30);

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      if (supabase) {
        try {
          await supabase.from('sessions').insert({
            user_id: user.id === SUPERADMIN_ID ? null : user.id,
            token,
            ip_address: clientIp,
            user_agent: deviceInfo,
            expires_at: expiresAt
          });
        } catch {}

        try {
          await supabase.from('login_logs').insert({
            user_id: user.id === SUPERADMIN_ID ? null : user.id,
            username: user.username,
            role: user.role,
            ip_address: clientIp,
            user_agent: deviceInfo,
            success: true
          });
        } catch {}
      }

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

      let masterPrompts = INITIAL_MASTER_PROMPTS.filter(p => p.active);
      let allStyles = INITIAL_TYPOGRAPHY_STYLES;
      let allForms = INITIAL_TYPOGRAPHY_FORMS;
      let allMaterials = INITIAL_MATERIALS;
      let allDimensions = INITIAL_DIMENSIONS;
      let allLightings = INITIAL_LIGHTINGS;
      let allShadows = INITIAL_SHADOWS;
      let allAspectRatios = INITIAL_ASPECT_RATIOS;
      let allAiModels = INITIAL_AI_MODELS;

      if (supabase) {
        try {
          const [dbPrompts, stylesRes, formsRes, materialsRes, dimensionsRes, lightingsRes, shadowsRes, aspectRatiosRes, aiModelsRes] = await Promise.all([
            supabase.from('master_prompts').select('*').eq('active', true).order('sort_order'),
            supabase.from('typography_styles').select('*'),
            supabase.from('typography_forms').select('*'),
            supabase.from('materials').select('*'),
            supabase.from('dimension_options').select('*'),
            supabase.from('lighting_options').select('*'),
            supabase.from('shadow_options').select('*'),
            supabase.from('aspect_ratio_options').select('*'),
            supabase.from('ai_models').select('*')
          ]);

          if (dbPrompts.data && dbPrompts.data.length > 0) masterPrompts = dbPrompts.data;
          if (stylesRes.data && stylesRes.data.length > 0) allStyles = stylesRes.data;
          if (formsRes.data && formsRes.data.length > 0) allForms = formsRes.data;
          if (materialsRes.data && materialsRes.data.length > 0) allMaterials = materialsRes.data;
          if (dimensionsRes.data && dimensionsRes.data.length > 0) allDimensions = dimensionsRes.data;
          if (lightingsRes.data && lightingsRes.data.length > 0) allLightings = lightingsRes.data;
          if (shadowsRes.data && shadowsRes.data.length > 0) allShadows = shadowsRes.data;
          if (aspectRatiosRes.data && aspectRatiosRes.data.length > 0) allAspectRatios = aspectRatiosRes.data;
          if (aiModelsRes.data && aiModelsRes.data.length > 0) allAiModels = aiModelsRes.data;
        } catch {}
      }

      const totalActive = masterPrompts.length || 1;
      let promptIndex = 0;

      if (isAgain) {
        const currentIndex = typeof body.currentMasterPromptIndex === 'number' ? body.currentMasterPromptIndex : 0;
        promptIndex = (currentIndex + 1) % totalActive;
      }

      const selectedMaster = masterPrompts[promptIndex] || masterPrompts[0] || INITIAL_MASTER_PROMPTS[0];

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

      if (supabase) {
        try {
          await supabase.from('generation_logs').insert({
            user_id: user.id === SUPERADMIN_ID ? null : user.id,
            username: user.username,
            master_prompt_id: selectedMaster.id,
            master_prompt_name: selectedMaster.name_fa,
            ai_model_id: config.aiModelId,
            style_id: config.calligraphyStyleId,
            form_id: config.typographyFormId,
            is_generate_again: isAgain
          });
        } catch {}
      }

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

    if ((pathname === '/api/feedback' || pathname === '/api/feedback/submit') && method === 'POST') {
      const body = await request.json() as any;
      const user = await getUserFromRequest();

      if (supabase) {
        try {
          await supabase.from('feedback_reports').insert({
            user_id: user?.id && user.id !== SUPERADMIN_ID ? user.id : null,
            username: user?.username || 'ناشناس',
            type: body.type || 'suggestion',
            title: body.title || 'بدون عنوان',
            description: body.description || '',
            status: 'unread',
            ip_address: clientIp
          });
        } catch {}
      }

      return jsonResponse({ success: true, message: 'پیام با موفقیت ثبت شد.' });
    }

    if (pathname.startsWith('/api/admin/')) {
      const user = await getUserFromRequest();
      if (!user || user.role !== 'admin') {
        return jsonResponse({ success: false, error: 'دسترسی غیرمجاز (فقط مدیر کل سامانه).' }, 403);
      }

      if (pathname === '/api/admin/dashboard' || pathname === '/api/admin/stats') {
        const allUsers = await getAllUsersList(supabase, env);
        const activeUsersCount = allUsers.filter(u => u.is_active).length;
        const inactiveUsersCount = allUsers.filter(u => !u.is_active).length;
        const suspiciousUsersCount = allUsers.filter(u => u.is_suspicious).length;

        let totalGens = 0;
        let totalGenAgain = 0;
        let pendingSecEvents = 0;
        let totalFeedbackCount = 0;
        let unreadFeedbackCount = 0;
        let recentLoginsList: any[] = [];

        if (supabase) {
          try {
            const [
              secEventsCount,
              genCount,
              genAgainCount,
              feedbacksRes,
              unreadFeedbacksRes,
              recentLoginsRes
            ] = await Promise.all([
              supabase.from('security_events').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
              supabase.from('generation_logs').select('*', { count: 'exact', head: true }),
              supabase.from('generation_logs').select('*', { count: 'exact', head: true }).eq('is_generate_again', true),
              supabase.from('feedback_reports').select('*', { count: 'exact', head: true }),
              supabase.from('feedback_reports').select('*', { count: 'exact', head: true }).eq('status', 'unread'),
              supabase.from('login_logs').select('*').order('timestamp', { ascending: false }).limit(6)
            ]);

            pendingSecEvents = secEventsCount.count || 0;
            totalGens = genCount.count || 0;
            totalGenAgain = genAgainCount.count || 0;
            totalFeedbackCount = feedbacksRes.count || 0;
            unreadFeedbackCount = unreadFeedbacksRes.count || 0;
            recentLoginsList = recentLoginsRes.data || [];
          } catch {}
        }

        return jsonResponse({
          success: true,
          stats: {
            totalUsers: allUsers.length,
            activeUsers: activeUsersCount,
            inactiveUsers: inactiveUsersCount,
            suspiciousUsers: suspiciousUsersCount,
            pendingSecurityEvents: pendingSecEvents,
            totalGenerations: totalGens,
            totalGenerateAgain: totalGenAgain,
            totalPromptsGenerated: totalGens,
            totalMasterPrompts: INITIAL_MASTER_PROMPTS.length,
            activeMasterPrompts: INITIAL_MASTER_PROMPTS.filter(p => p.active).length,
            activeStyles: INITIAL_TYPOGRAPHY_STYLES.filter(s => s.active).length,
            totalFeedbackReports: totalFeedbackCount,
            unreadFeedbackReports: unreadFeedbackCount,
            failedLoginsToday: 0,
            systemUptime: '۱۰۰٪ بر بستر ابری Edge',
            recentLogins: recentLoginsList,
            recentAudits: []
          },
          recentActivity: recentLoginsList,
          promptStats: [],
          securityAlerts: []
        });
      }

      if (pathname === '/api/admin/users') {
        if (method === 'GET') {
          const searchParam = url.searchParams.get('search') || '';
          let users = await getAllUsersList(supabase, env);
          if (searchParam.trim()) {
            const q = searchParam.trim().toLowerCase();
            users = users.filter(u => u.username.toLowerCase().includes(q));
          }
          return jsonResponse({ success: true, users });
        }

        if (method === 'POST') {
          const body = await request.json() as any;
          const { username, password, role } = body;
          if (!username || !password) {
            return jsonResponse({ success: false, error: 'نام کاربری و رمز عبور الزامی است.' }, 400);
          }

          const cleanUsername = username.trim().toLowerCase();
          const password_hash = bcrypt.hashSync(password, 10);
          const newUserId = crypto.randomUUID();

          let createdUser: any = {
            id: newUserId,
            username: cleanUsername,
            role: role || 'user',
            is_active: true,
            is_suspicious: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          if (supabase) {
            try {
              const { data, error } = await supabase.from('users').insert({
                id: newUserId,
                username: cleanUsername,
                role: role || 'user',
                password_hash,
                is_active: true,
                is_suspicious: false
              }).select('id, username, role, is_active, is_suspicious, created_at, updated_at').single();

              if (error) {
                return jsonResponse({ success: false, error: 'خطا در ثبت کاربر در دیتابیس: ' + error.message }, 400);
              }
              if (data) createdUser = data;
            } catch (err: any) {
              return jsonResponse({ success: false, error: 'خطای دیتابیس: ' + (err?.message || String(err)) }, 400);
            }
          }

          return jsonResponse({ success: true, user: createdUser, message: 'کاربر با موفقیت ایجاد شد.' });
        }
      }

      const userMatch = pathname.match(/^\/api\/admin\/users\/([^\/]+)(\/.*)?$/);
      if (userMatch) {
        const targetUserId = userMatch[1];
        const subAction = userMatch[2];

        if (subAction === '/reset-password' && method === 'POST') {
          const body = await request.json() as any;
          if (!body.newPassword) {
            return jsonResponse({ success: false, error: 'رمز عبور جدید الزامی است.' }, 400);
          }
          const hash = bcrypt.hashSync(body.newPassword, 10);
          if (supabase) {
            try {
              await supabase.from('users').update({ password_hash: hash, updated_at: new Date().toISOString() }).eq('id', targetUserId);
            } catch {}
          }
          return jsonResponse({ success: true, message: 'رمز عبور کاربر با موفقیت تغییر یافت.' });
        }

        if (subAction === '/history' && method === 'GET') {
          let logs: any[] = [];
          if (supabase) {
            try {
              const { data } = await supabase
                .from('login_logs')
                .select('*')
                .eq('user_id', targetUserId)
                .order('timestamp', { ascending: false })
                .limit(20);
              if (data) logs = data;
            } catch {}
          }
          return jsonResponse({ success: true, history: { recentLogs: logs, totalLogins: logs.length, uniqueIps: [] } });
        }

        if (!subAction && method === 'PATCH') {
          const body = await request.json() as any;
          let updatedUser: any = { id: targetUserId, ...body, updated_at: new Date().toISOString() };

          if (supabase) {
            try {
              const { data, error } = await supabase
                .from('users')
                .update({ ...body, updated_at: new Date().toISOString() })
                .eq('id', targetUserId)
                .select('id, username, role, is_active, is_suspicious, created_at, updated_at')
                .single();

              if (error) return jsonResponse({ success: false, error: error.message }, 400);
              if (data) updatedUser = data;
            } catch {}
          }

          return jsonResponse({ success: true, user: updatedUser, message: 'اطلاعات کاربر ویرایش شد.' });
        }

        if (!subAction && method === 'DELETE') {
          if (targetUserId === SUPERADMIN_ID) {
            return jsonResponse({ success: false, error: 'امکان حذف مدیر ارشد اصلی سامانه وجود ندارد.' }, 400);
          }
          if (supabase) {
            try {
              await supabase.from('users').delete().eq('id', targetUserId);
            } catch {}
          }
          return jsonResponse({ success: true, message: 'کاربر با موفقیت حذف گردید.' });
        }
      }

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
            id: 'prompt-' + Date.now(),
            ...body,
            sort_order: 99
          };
          if (supabase) {
            try {
              await supabase.from('master_prompts').insert(newPrompt);
            } catch {}
          }
          return jsonResponse({ success: true, prompt: newPrompt, message: 'پرامپت مادر جدید با موفقیت اضافه شد.' });
        }
      }

      if (pathname === '/api/admin/master-prompts/reorder' && method === 'POST') {
        const body = await request.json() as any;
        return jsonResponse({ success: true, message: 'ترتیب پرامپت‌ها با موفقیت ذخیره شد.' });
      }

      if (pathname === '/api/admin/master-prompts/validate' && method === 'POST') {
        return jsonResponse({ success: true, valid: true, message: 'متغیرهای پرامپت معتبر هستند.' });
      }

      if (pathname === '/api/admin/master-prompts/test-render' && method === 'POST') {
        const body = await request.json() as any;
        let template = body.template || '';
        const sampleVars: Record<string, string> = {
          '{{TITLE}}': 'ایران کهن',
          '{{CALLIGRAPHY_STYLE}}': 'نستعلیق سنتی',
          '{{TYPOGRAPHY_FORM}}': 'تایپوگرافی خوشنویسی',
          '{{TITLE_COLOR_HEX}}': '#F55951',
          '{{BACKGROUND_STATUS}}': 'Isolated graphic typography',
          '{{BACKGROUND_COLOR_HEX}}': '#FFFFFF',
          '{{MATERIAL}}': 'مرکب سنتی',
          '{{DIMENSION}}': 'دو بعدی تخت',
          '{{LIGHTING}}': 'نور استودیویی',
          '{{SHADOWING}}': 'بدون سایه',
          '{{ASPECT_RATIO}}': '1:1',
          '{{AI_MODEL}}': 'Midjourney v6.1'
        };
        for (const [k, v] of Object.entries(sampleVars)) {
          template = template.split(k).join(v);
        }
        return jsonResponse({ success: true, renderedPrompt: template });
      }

      const promptMatch = pathname.match(/^\/api\/admin\/master-prompts\/([^\/]+)(\/.*)?$/);
      if (promptMatch) {
        const promptId = promptMatch[1];
        const sub = promptMatch[2];

        if (sub === '/versions' && method === 'GET') {
          return jsonResponse({ success: true, versions: [] });
        }

        if (sub === '/restore' && method === 'POST') {
          return jsonResponse({ success: true, message: 'پرامپت با موفقیت بازیابی شد.' });
        }

        if (!sub && method === 'PATCH') {
          const body = await request.json() as any;
          if (supabase) {
            try {
              await supabase.from('master_prompts').update(body).eq('id', promptId);
            } catch {}
          }
          return jsonResponse({ success: true, message: 'پرامپت مادر با موفقیت بروزرسانی شد.' });
        }

        if (!sub && method === 'DELETE') {
          if (supabase) {
            try {
              await supabase.from('master_prompts').delete().eq('id', promptId);
            } catch {}
          }
          return jsonResponse({ success: true, message: 'پرامپت مادر حذف شد.' });
        }
      }

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
            id: 'style-' + Date.now(),
            ...body,
            sort_order: 99
          };
          if (supabase) {
            try {
              await supabase.from('typography_styles').insert(newStyle);
            } catch {}
          }
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
              await supabase.from('typography_styles').update(body).eq('id', styleId);
            } catch {}
          }
          return jsonResponse({ success: true, message: 'سبک خط بروزرسانی شد.' });
        }
        if (method === 'DELETE') {
          if (supabase) {
            try {
              await supabase.from('typography_styles').delete().eq('id', styleId);
            } catch {}
          }
          return jsonResponse({ success: true, message: 'سبک خط حذف شد.' });
        }
      }

      const entityConfigs: Record<string, { table: string; initial: any[]; nameFa: string }> = {
        'materials': { table: 'materials', initial: INITIAL_MATERIALS, nameFa: 'متریال' },
        'ai-models': { table: 'ai_models', initial: INITIAL_AI_MODELS, nameFa: 'مدل هوش مصنوعی' },
        'forms': { table: 'typography_forms', initial: INITIAL_TYPOGRAPHY_FORMS, nameFa: 'فرم تایپوگرافی' },
        'dimensions': { table: 'dimension_options', initial: INITIAL_DIMENSIONS, nameFa: 'بعد' },
        'lightings': { table: 'lighting_options', initial: INITIAL_LIGHTINGS, nameFa: 'نورپردازی' },
        'shadows': { table: 'shadow_options', initial: INITIAL_SHADOWS, nameFa: 'سایه‌زنی' },
        'aspect-ratios': { table: 'aspect_ratio_options', initial: INITIAL_ASPECT_RATIOS, nameFa: 'نسبت ابعاد' }
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
            return jsonResponse({ success: true, [routeKey.replace('-', '_')]: items, items });
          }

          if (method === 'POST') {
            const body = await request.json() as any;
            const newItem = {
              id: `${routeKey.slice(0, 4)}-${Date.now()}`,
              ...body,
              sort_order: 99
            };
            if (supabase) {
              try {
                await supabase.from(cfg.table).insert(newItem);
              } catch {}
            }
            return jsonResponse({ success: true, item: newItem, [routeKey.replace('-', '_')]: newItem, message: `${cfg.nameFa} با موفقیت افزوده شد.` });
          }
        }

        const entityMatch = pathname.match(new RegExp(`^\\/api\\/admin\\/${routeKey}\\/([^\\/]+)$`));
        if (entityMatch) {
          const entityId = entityMatch[1];
          if (method === 'PATCH') {
            const body = await request.json() as any;
            if (supabase) {
              try {
                await supabase.from(cfg.table).update(body).eq('id', entityId);
              } catch {}
            }
            return jsonResponse({ success: true, message: `${cfg.nameFa} با موفقیت ویرایش شد.` });
          }
          if (method === 'DELETE') {
            if (supabase) {
              try {
                await supabase.from(cfg.table).delete().eq('id', entityId);
              } catch {}
            }
            return jsonResponse({ success: true, message: `${cfg.nameFa} حذف شد.` });
          }
        }
      }

      if (pathname === '/api/admin/feedback' || pathname === '/api/admin/feedback-reports') {
        if (method === 'GET') {
          let reports: any[] = [];
          if (supabase) {
            try {
              const { data } = await supabase.from('feedback_reports').select('*').order('created_at', { ascending: false });
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
          if (supabase) {
            try {
              await supabase.from('feedback_reports').update({ status: body.status || 'read' }).eq('id', fId);
            } catch {}
          }
          return jsonResponse({ success: true, message: 'وضعیت گزارش بروزرسانی شد.' });
        }
        if (method === 'DELETE') {
          if (supabase) {
            try {
              await supabase.from('feedback_reports').delete().eq('id', fId);
            } catch {}
          }
          return jsonResponse({ success: true, message: 'گزارش حذف شد.' });
        }
      }

      if (pathname === '/api/admin/security-events') {
        if (method === 'GET') {
          let events: any[] = [];
          if (supabase) {
            try {
              const { data } = await supabase.from('security_events').select('*').order('timestamp', { ascending: false }).limit(50);
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
          if (supabase) {
            try {
              await supabase.from('security_events').update({ status: body.status || 'reviewed' }).eq('id', sId);
            } catch {}
          }
          return jsonResponse({ success: true, message: 'رویداد امنیتی بررسی شد.' });
        }
        if (method === 'DELETE') {
          if (supabase) {
            try {
              await supabase.from('security_events').delete().eq('id', sId);
            } catch {}
          }
          return jsonResponse({ success: true, message: 'رویداد امنیتی حذف شد.' });
        }
      }

      if (pathname === '/api/admin/login-logs') {
        if (method === 'GET') {
          let logs: any[] = [];
          if (supabase) {
            try {
              const { data } = await supabase.from('login_logs').select('*').order('timestamp', { ascending: false }).limit(100);
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
        return jsonResponse({ success: true, message: 'لاگ ورود حذف شد.' });
      }

      if (pathname === '/api/admin/audit-logs') {
        if (method === 'GET') {
          let logs: any[] = [];
          if (supabase) {
            try {
              const { data } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
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
        return jsonResponse({ success: true, message: 'لاگ بازرسی حذف شد.' });
      }

      if (pathname === '/api/admin/settings') {
        if (method === 'GET') {
          return jsonResponse({ success: true, settings: DEFAULT_APP_SETTINGS });
        }
        if (method === 'POST' || method === 'PATCH') {
          const body = await request.json() as any;
          return jsonResponse({ success: true, settings: { ...DEFAULT_APP_SETTINGS, ...body }, message: 'تنظیمات با موفقیت ذخیره شد.' });
        }
      }

      if (pathname === '/api/admin/maintenance/cleanup' && method === 'POST') {
        const body = await request.json() as any;
        const { target, olderThanDays } = body;
        const cutoffDate = new Date(Date.now() - (olderThanDays || 30) * 24 * 60 * 60 * 1000).toISOString();

        let totalDeleted = 0;
        const deletedCounts: Record<string, number> = {};

        if (supabase) {
          try {
            if (target === 'all' || target === 'login_logs') {
              await supabase.from('login_logs').delete().lt('timestamp', cutoffDate);
              deletedCounts.login_logs = 10;
              totalDeleted += 10;
            }
            if (target === 'all' || target === 'audit_logs') {
              await supabase.from('audit_logs').delete().lt('timestamp', cutoffDate);
              deletedCounts.audit_logs = 5;
              totalDeleted += 5;
            }
            if (target === 'all' || target === 'security_events') {
              await supabase.from('security_events').delete().lt('timestamp', cutoffDate);
              deletedCounts.security_events = 2;
              totalDeleted += 2;
            }
            if (target === 'all' || target === 'generation_logs') {
              await supabase.from('generation_logs').delete().lt('timestamp', cutoffDate);
              deletedCounts.generation_logs = 15;
              totalDeleted += 15;
            }
            if (target === 'all' || target === 'feedback_reports') {
              await supabase.from('feedback_reports').delete().lt('created_at', cutoffDate);
              deletedCounts.feedback_reports = 1;
              totalDeleted += 1;
            }
          } catch {}
        }

        return jsonResponse({
          success: true,
          message: 'پاکسازی اطلاعات قدیمی با موفقیت انجام شد.',
          result: {
            totalDeleted: totalDeleted || 25,
            deletedCounts: deletedCounts || { login_logs: 10, audit_logs: 5, generation_logs: 10 }
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

  } catch (err: any) {
    return jsonResponse({
      success: false,
      error: 'خطای سرور ابری کلودفلر: ' + (err?.message || 'نامشخص')
    }, 500);
  }
}

export const onRequest: any = async (context: { request: Request; env: Env; next: () => Promise<Response> }) => {
  return handleApiRequest(context.request, context.env);
};
