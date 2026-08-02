import type { AdminUser, Category, MenuItem, Section, Translation } from '../types';

const TOKEN_KEY = 'volidam-api-token';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function apiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return '/api';
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = false,
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${apiBase()}${path}`, { ...options, headers });
  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { success: false, error: text };
    }
  }

  if (!res.ok) {
    const errMsg =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: string }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(errMsg, res.status);
  }

  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as { success: boolean; data?: T; message?: string; error?: string };
    if (!envelope.success) {
      throw new ApiError(envelope.error || 'Request failed', res.status);
    }
    return (envelope.data ?? (envelope as unknown as T)) as T;
  }

  return body as T;
}

/* -------- Auth -------- */

export async function login(username: string, password: string) {
  return request<{
    token: string;
    admin: AdminUser;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logout() {
  try {
    await request<{ message: string }>('/auth/logout', { method: 'POST' }, true);
  } finally {
    setToken(null);
  }
}

/* -------- Menu items -------- */

export async function fetchMenuItems() {
  const items = await request<MenuItem[]>('/menu-items');
  return items.map((it) => ({
    ...it,
    price: Number(it.price),
    photo: it.photo || null,
  }));
}

export async function createMenuItem(payload: {
  category_id: number;
  title: Translation;
  photo?: string | null;
  weight?: string;
  price: number;
}) {
  const item = await request<MenuItem>(
    '/menu-items',
    { method: 'POST', body: JSON.stringify(payload) },
    true,
  );
  return { ...item, price: Number(item.price), photo: item.photo || null };
}

export async function updateMenuItem(
  id: number,
  payload: Partial<{
    category_id: number;
    title: Translation;
    photo: string | null;
    weight: string;
    price: number;
  }>,
) {
  const item = await request<MenuItem>(
    `/menu-items/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    true,
  );
  return { ...item, price: Number(item.price), photo: item.photo || null };
}

export async function deleteMenuItem(id: number) {
  return request<{ message?: string }>(`/menu-items/${id}`, { method: 'DELETE' }, true);
}

/* -------- Categories -------- */

export async function fetchCategories() {
  return request<Category[]>('/categories');
}

export async function createCategory(payload: {
  name: Translation;
  order: number;
  sectionId: number;
}) {
  return request<Category>(
    '/categories',
    { method: 'POST', body: JSON.stringify(payload) },
    true,
  );
}

export async function updateCategory(
  id: number,
  payload: Partial<{ name: Translation; order: number; sectionId: number }>,
) {
  return request<Category>(
    `/categories/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    true,
  );
}

export async function deleteCategory(id: number) {
  return request<{ message?: string }>(`/categories/${id}`, { method: 'DELETE' }, true);
}

/* -------- Sections -------- */

export async function fetchSections() {
  return request<Section[]>('/sections');
}

export async function createSection(payload: { name: Translation; sort_order: number }) {
  return request<Section>(
    '/sections',
    { method: 'POST', body: JSON.stringify(payload) },
    true,
  );
}

export async function updateSection(
  id: number,
  payload: Partial<{ name: Translation; sort_order: number }>,
) {
  return request<Section>(
    `/sections/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    true,
  );
}

export async function deleteSection(id: number) {
  return request<{ message?: string }>(`/sections/${id}`, { method: 'DELETE' }, true);
}

/* -------- Admins -------- */

export async function fetchAdmins() {
  return request<AdminUser[]>('/admins', {}, true);
}

export async function createAdmin(payload: {
  username: string;
  password: string;
  admin_status?: 'super' | 'admin';
}) {
  return request<AdminUser>(
    '/admins',
    {
      method: 'POST',
      body: JSON.stringify({
        username: payload.username,
        password: payload.password,
        admin_status: payload.admin_status ?? 'admin',
      }),
    },
    true,
  );
}

export async function updateAdminUsername(id: number, username: string) {
  return request<AdminUser>(
    `/admins/${id}/username`,
    { method: 'PUT', body: JSON.stringify({ username }) },
    true,
  );
}

export async function updateAdminPassword(id: number, password: string) {
  return request<AdminUser>(
    `/admins/${id}/password`,
    { method: 'PUT', body: JSON.stringify({ password }) },
    true,
  );
}

export async function updateAdminStatus(id: number, admin_status: 'super' | 'admin') {
  return request<AdminUser>(
    `/admins/${id}/status`,
    { method: 'PUT', body: JSON.stringify({ admin_status }) },
    true,
  );
}

export async function deleteAdmin(id: number) {
  return request<{ message?: string }>(`/admins/${id}`, { method: 'DELETE' }, true);
}
