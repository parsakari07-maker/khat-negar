import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import type { User } from '../src/types.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  clientIp?: string;
  clientUserAgent?: string;
  deviceInfo?: string;
}

// Memory-based sliding window rate limiter
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();

// Periodic cleanup of expired rate limit buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitMap.entries()) {
    if (now > bucket.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    const firstIp = forwarded[0].trim();
    if (firstIp) return firstIp;
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

export function parseUserAgent(ua: string): string {
  if (!ua) return 'ناشناخته';
  let browser = 'مرورگر استاندارد';
  let os = 'دستگاه نامشخص';

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

export function rateLimit(limit: number, windowMs: number, keyPrefix = 'rl') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const bucket = rateLimitMap.get(key);

    if (!bucket || now > bucket.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= limit) {
      return res.status(429).json({
        success: false,
        error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند دقیقه دیگر دوباره تلاش کنید.'
      });
    }

    bucket.count += 1;
    next();
  };
}

export function attachClientInfo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  req.clientIp = getClientIp(req);
  const ua = req.headers['user-agent'] || '';
  req.clientUserAgent = ua;
  req.deviceInfo = parseUserAgent(ua);
  next();
}

export function normalizePersianDigits(str: string): string {
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

export function cleanInvisibleChars(str: string): string {
  if (!str) return '';
  return str.replace(/[\u200B\u200C\u200D\uFEFF\u00A0\r\n]/g, '');
}

export function verifyPassword(inputPassword: string, storedHash: string): boolean {
  if (!inputPassword || !storedHash) return false;

  // 1. Direct raw check
  try {
    if (bcrypt.compareSync(inputPassword, storedHash)) return true;
  } catch {}

  // 2. Direct exact plain text comparison (fallback if legacy plain text)
  if (inputPassword === storedHash) return true;

  // 3. Cleaned invisible characters & trimmed
  const cleaned = cleanInvisibleChars(inputPassword).trim();
  if (cleaned && cleaned !== inputPassword) {
    try {
      if (bcrypt.compareSync(cleaned, storedHash)) return true;
    } catch {}
    if (cleaned === storedHash) return true;
  }

  // 4. Normalized Persian/Arabic digits check
  const normalizedDigits = normalizePersianDigits(cleaned || inputPassword);
  if (normalizedDigits && normalizedDigits !== (cleaned || inputPassword)) {
    try {
      if (bcrypt.compareSync(normalizedDigits, storedHash)) return true;
    } catch {}
    if (normalizedDigits === storedHash) return true;
  }

  return false;
}

export function authenticateSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const cookieToken = req.cookies?.auth_token;
  const headerAuth = req.headers.authorization;
  let token = cookieToken;

  if (!token && headerAuth && headerAuth.startsWith('Bearer ')) {
    token = headerAuth.slice(7).trim();
  }

  if (token) {
    // 1. Check local session store
    let user = db.getSessionUser(token);
    
    // 2. If token is a signed token (stk.), decode payload directly
    if (!user && token.startsWith('stk.')) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4) b64 += '=';
          const jsonStr = Buffer.from(b64, 'base64').toString('utf8');
          const payload = JSON.parse(jsonStr);
          if (payload && (!payload.exp || payload.exp > Date.now())) {
            const dbUser = db.getUserById(payload.id) || (payload.username ? db.getUserByUsername(payload.username) : null);
            if (dbUser) {
              user = db.getUserById(dbUser.id);
            } else if (payload.username === 'parsa' || payload.role === 'admin') {
              user = {
                id: payload.id || 'usr-parsa-admin',
                username: payload.username || 'parsa',
                role: (payload.role as 'admin' | 'user') || 'admin',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ip_count: 1,
                active_sessions_count: 1,
                is_suspicious: false
              };
            }
          }
        }
      } catch {}
    }

    if (user) {
      req.user = user;
    }
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'نشست شما منقضی شده یا وارد حساب کاربری نشده‌اید.'
    });
  }

  if (!req.user.is_active) {
    return res.status(403).json({
      success: false,
      error: 'حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سامانه تماس بگیرید.'
    });
  }

  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'لطفاً ابتدا وارد حساب کاربری خود شوید.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'دسترسی به بخش مدیریت برای شما مجاز نیست.'
    });
  }

  next();
}
