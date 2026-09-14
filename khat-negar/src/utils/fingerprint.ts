/**
 * Multi-factor stable device & environment fingerprint generator
 * Combines hardware, display, canvas entropy and persistent multi-layer storage (Cookie + LocalStorage)
 */

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

function getCanvasHash(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'nocanvas';
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Vazirmatn', Arial, sans-serif";
    ctx.fillStyle = '#F55951';
    ctx.fillRect(0, 0, 160, 40);
    ctx.fillStyle = '#361D32';
    ctx.fillText('خط‌نگار Persian Typography 1389', 2, 2);
    ctx.strokeStyle = '#EDDFE0';
    ctx.strokeRect(5, 5, 150, 30);
    return simpleHash(canvas.toDataURL());
  } catch {
    return 'canv_err';
  }
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setPersistentCookie(name: string, value: string, days = 730) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

export function getOrCreateDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server-side';

  const STORAGE_KEY = 'app_device_fp';
  const COOKIE_KEY = 'device_fp';

  // 1. Check existing storage
  let storedFp = localStorage.getItem(STORAGE_KEY);
  let cookieFp = getCookie(COOKIE_KEY);

  if (storedFp && !cookieFp) {
    setPersistentCookie(COOKIE_KEY, storedFp);
    return storedFp;
  }
  if (!storedFp && cookieFp) {
    localStorage.setItem(STORAGE_KEY, cookieFp);
    return cookieFp;
  }
  if (storedFp && cookieFp) {
    return storedFp;
  }

  // 2. Compute hardware and display characteristics
  const screen = typeof window !== 'undefined' ? window.screen : { width: 0, height: 0, colorDepth: 24 };
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : {};
  const tz = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone || 'Asia/Tehran';
  const canvasHash = getCanvasHash();

  const components = [
    screen?.width || 0,
    screen?.height || 0,
    screen?.colorDepth || 24,
    nav?.language || 'fa-IR',
    nav?.hardwareConcurrency || 4,
    nav?.deviceMemory || 4,
    tz,
    canvasHash
  ].join(':::');

  const computedHash = simpleHash(components);
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const newFp = `dfp_${computedHash}_${randomSuffix}`;

  try {
    localStorage.setItem(STORAGE_KEY, newFp);
    setPersistentCookie(COOKIE_KEY, newFp);
  } catch {
    // Ignore storage errors
  }

  return newFp;
}
