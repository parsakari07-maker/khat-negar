import { createClient } from '@supabase/supabase-js';
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

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  DATABASE_URL?: string;
  JWT_SECRET?: string;
}

function getSupabase(env: Env) {
  const url = env.SUPABASE_URL || 'https://vbbnxuzyduezeyztvbzp.supabase.co';
  const key = env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiYm54dXp5ZHVlemV5enR2YnpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzgyMDI4NSwiZXhwIjoyMTAzMzk2Mjg1fQ.oRHM-RWIa6El3KP5ixegKc5szthggieeNqoBlw8MMAw';
  return createClient(url, key);
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

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, '');
  const method = request.method;
  const supabase = getSupabase(env);
  const clientIp = getClientIp(request);
  const ua = request.headers.get('user-agent') || '';
  const deviceInfo = parseUserAgent(ua);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const jsonResponse = (data: any, status = 200, extraHeaders: Record<string, string> = {}) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...corsHeaders,
        ...extraHeaders
      }
    });
  };

  // Helper to extract authenticated user from token
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
    // 1. Health check
    // -------------------------------------------------------------
    if (pathname === '/api/health') {
      return jsonResponse({
        status: 'ok',
        runtime: 'Cloudflare Pages Functions / Workers',
        time: new Date().toISOString(),
        supabase: !!env.SUPABASE_URL
      });
    }

    // -------------------------------------------------------------
    // 2. Public / Init Generator Options
    // -------------------------------------------------------------
    if (pathname === '/api/init-data' && method === 'GET') {
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
        masterPrompts: (promptsRes.data && promptsRes.data.length > 0) ? promptsRes.data : INITIAL_MASTER_PROMPTS
      });
    }

    // -------------------------------------------------------------
    // 3. Authentication: Login / Logout / Me
    // -------------------------------------------------------------
    if (pathname === '/api/login' && method === 'POST') {
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

    if (pathname === '/api/me' && method === 'GET') {
      const user = await getUserFromRequest();
      if (!user) {
        return jsonResponse({ success: false, user: null }, 200);
      }
      return jsonResponse({ success: true, user });
    }

    if (pathname === '/api/logout' && method === 'POST') {
      const cookieVal = `auth_token=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`;
      return jsonResponse({ success: true }, 200, { 'Set-Cookie': cookieVal });
    }

    // -------------------------------------------------------------
    // 4. Feedback & Bug Reports
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
    // 5. Generation Logs (Analytics)
    // -------------------------------------------------------------
    if (pathname === '/api/logs/generation' && method === 'POST') {
      const body = await request.json() as any;
      const user = await getUserFromRequest();

      await supabase.from('generation_logs').insert({
        user_id: user?.id || null,
        username: user?.username || 'مهمان',
        master_prompt_id: body.master_prompt_id || null,
        master_prompt_name: body.master_prompt_name || null,
        ai_model_id: body.ai_model_id || null,
        style_id: body.style_id || null,
        form_id: body.form_id || null,
        is_generate_again: !!body.is_generate_again
      });

      return jsonResponse({ success: true });
    }

    // -------------------------------------------------------------
    // 6. Admin Endpoints (Secured)
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/admin/')) {
      const user = await getUserFromRequest();
      if (!user || user.role !== 'admin') {
        return jsonResponse({ success: false, error: 'دسترسی غیرمجاز.' }, 403);
      }

      // Admin stats
      if (pathname === '/api/admin/stats' && method === 'GET') {
        const [usersCount, logsCount, feedbackCount] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('generation_logs').select('*', { count: 'exact', head: true }),
          supabase.from('feedback_reports').select('*', { count: 'exact', head: true })
        ]);

        return jsonResponse({
          success: true,
          stats: {
            totalUsers: usersCount.count || 0,
            totalGenerations: logsCount.count || 0,
            totalFeedback: feedbackCount.count || 0
          }
        });
      }

      // Admin user management
      if (pathname === '/api/admin/users' && method === 'GET') {
        const { data: users } = await supabase
          .from('users')
          .select('id, username, role, is_active, is_suspicious, created_at, updated_at')
          .order('created_at', { ascending: false });
        return jsonResponse({ success: true, users: users || [] });
      }

      // Admin audit / login logs
      if (pathname === '/api/admin/logs' && method === 'GET') {
        const { data: loginLogs } = await supabase
          .from('login_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);
        return jsonResponse({ success: true, logs: loginLogs || [] });
      }
    }

    // Default Fallback
    return jsonResponse({
      success: true,
      message: 'Cloudflare Edge API Route active',
      path: pathname
    });

  } catch (err: any) {
    return jsonResponse({
      success: false,
      error: 'خطای سرور ابری کلودفلر: ' + (err?.message || 'نامشخص')
    }, 500);
  }
};
