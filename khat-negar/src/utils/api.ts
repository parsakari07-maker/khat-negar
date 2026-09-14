import { getOrCreateDeviceFingerprint } from './fingerprint.js';

// Centralized API utility for authenticated requests with Bearer token & cookie credentials

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  [key: string]: any;
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  } catch {
    // Ignore storage quota errors
  }
}

export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: ApiResponse<T> }> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  // Attach Content-Type if body is present and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach Bearer Token if available
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Attach Stable Device Fingerprint Header
  if (!headers['X-Device-Fingerprint']) {
    headers['X-Device-Fingerprint'] = getOrCreateDeviceFingerprint();
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include' // Send cookies whenever possible
  };

  try {
    const response = await fetch(url, mergedOptions);
    let data: ApiResponse<T>;

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType && (contentType.includes('application/sql') || contentType.includes('text/'))) {
      const text = await response.text();
      data = { success: response.ok, rawText: text } as any;
    } else {
      data = { success: response.ok } as any;
    }

    // Standardize 401 / 403 error messages if not provided by server
    if (response.status === 401 && !data.error) {
      data.error = 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید.';
    } else if (response.status === 403 && !data.error) {
      data.error = 'شما اجازه انجام این عملیات را ندارید.';
    }

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (err: any) {
    console.error(`API Fetch failed for ${url}:`, err);
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        error: 'خطای ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.'
      } as ApiResponse<T>
    };
  }
}
