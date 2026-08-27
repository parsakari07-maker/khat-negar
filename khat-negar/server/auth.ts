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

export function authenticateSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const cookieToken = req.cookies?.auth_token;
  const headerAuth = req.headers.authorization;
  let token = cookieToken;

  if (!token && headerAuth && headerAuth.startsWith('Bearer ')) {
    token = headerAuth.slice(7).trim();
  }

  if (token) {
    const user = db.getSessionUser(token);
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
