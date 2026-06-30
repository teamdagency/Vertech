const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: 'no-store',
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? 'Une erreur est survenue.');
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: 'GET' }, token),
  post: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }, token),
  patch: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }, token),
  put: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }, token),
  del: <T>(path: string, token?: string) => request<T>(path, { method: 'DELETE' }, token),
};
