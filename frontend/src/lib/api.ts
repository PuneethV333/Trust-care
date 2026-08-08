import { getAuthInstance } from './firebase';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
const API_PREFIX = '/api';

export class ApiError extends Error {
  readonly status: number;
  readonly details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function normalizePath(path: string): string {
  if (path.startsWith('http')) return path;
  if (path.startsWith(API_PREFIX)) return `${BASE_URL}${path}`;
  return `${BASE_URL}${API_PREFIX}/${path.replace(/^\//, '')}`;
}

async function getAuthToken(): Promise<string | null> {
  try {
    const user = getAuthInstance().currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    // Firebase not configured or not signed in — request will 401 server-side.
    return null;
  }
}

interface ErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

async function request<T>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  tokenOverride?: string | null,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const token = tokenOverride === undefined ? await getAuthToken() : tokenOverride;

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) query.set(key, String(value));
  }
  const queryString = query.toString();
  const url = `${normalizePath(path)}${queryString ? `?${queryString}` : ''}`;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Network error — please check your connection');
  }

  if (!response.ok) {
    let errorBody: ErrorBody = {};
    try {
      errorBody = (await response.json()) as ErrorBody;
    } catch {
      // Non-JSON error body
    }
    const raw = errorBody.message ?? `Request failed (${response.status})`;
    const messages = Array.isArray(raw) ? raw : [raw];
    throw new ApiError(response.status, messages.join(', '), messages);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(
    path: string,
    params?: Record<string, string | number | undefined>,
    tokenOverride?: string | null,
  ) => request<T>(path, 'GET', undefined, tokenOverride, params),
  post: <T>(path: string, body?: unknown, tokenOverride?: string | null) =>
    request<T>(path, 'POST', body, tokenOverride),
  patch: <T>(path: string, body?: unknown, tokenOverride?: string | null) =>
    request<T>(path, 'PATCH', body, tokenOverride),
  del: <T>(path: string, tokenOverride?: string | null) =>
    request<T>(path, 'DELETE', undefined, tokenOverride),
};
