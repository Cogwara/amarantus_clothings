import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_SERVER_URL = 'https://amarantus-clothings.vercel.app';
const SERVER_URL_KEY = '@amarantus_server_url';
const SESSION_TOKEN_KEY = '@amarantus_session_token';
const USER_KEY = '@amarantus_user';

export async function getServerUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(SERVER_URL_KEY);
    return saved && saved.trim().length > 0 ? saved.trim() : DEFAULT_SERVER_URL;
  } catch {
    return DEFAULT_SERVER_URL;
  }
}

export async function setServerUrl(url: string): Promise<void> {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  await AsyncStorage.setItem(SERVER_URL_KEY, cleanUrl);
}

export async function getSessionToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([SESSION_TOKEN_KEY, USER_KEY]);
}

export async function getStoredUser(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: any): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<{ ok: boolean; status: number; data?: T; error?: string; token?: string }> {
  try {
    const baseUrl = await getServerUrl();
    const token = await getSessionToken();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Cookie'] = `clothshop_session=${token}`;
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Extract set-cookie if login
    let receivedToken: string | undefined;
    const cookieHeader = res.headers.get('set-cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/clothshop_session=([^;]+)/);
      if (match && match[1]) {
        receivedToken = match[1];
        await setSessionToken(receivedToken);
      }
    }

    let data: any = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!res.ok) {
      const errorMessage =
        data?.error || data?.message || `Request failed with status ${res.status}`;
      return { ok: false, status: res.status, error: errorMessage };
    }

    return { ok: true, status: res.status, data, token: receivedToken };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { ok: false, status: 408, error: 'Request timed out. Check your connection.' };
    }
    return { ok: false, status: 0, error: err.message || 'Network request failed' };
  }
}

export function formatNaira(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₦0';
  return '₦' + Math.round(amount).toLocaleString('en-NG');
}
