import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AdminRole, AdminUser } from '../types';
import * as api from '../api/client';
import { ApiError, getToken, setToken } from '../api/client';

const SESSION_KEY = 'volidam-admin-session';

const PROTECTED_USERNAME = 'amonovvv';
function isProtected(username: string | null | undefined): boolean {
  return (username || '').toLowerCase() === PROTECTED_USERNAME;
}

interface AuthCtx {
  currentUser: string | null;
  currentUserId: number | null;
  currentRole: AdminRole | null;
  isSuperAdmin: boolean;
  users: AdminUser[];
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  createUser: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  changeOwnPassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  changeOwnUsername: (newUsername: string) => Promise<{ ok: boolean; error?: string }>;
  deleteUser: (id: number) => Promise<{ ok: boolean; error?: string }>;
  setUserRole: (id: number, role: AdminRole) => Promise<{ ok: boolean; error?: string }>;
}

const Ctx = createContext<AuthCtx | null>(null);

function mapApiError(err: unknown): string {
  if (err instanceof ApiError) {
    const msg = err.message;
    if (err.status === 401 || /noto'?g'?ri|wrong|parol/i.test(msg)) return 'wrongCreds';
    if (err.status === 403 || /ruxsat|forbidden/i.test(msg)) return 'notAuthorized';
    if (/mavjud|exists|band|taken/i.test(msg) || err.status === 409) return 'userExists';
    return msg;
  }
  return 'wrongCreds';
}

function saveSession(user: { id: number; username: string; admin_status: AdminRole } | null) {
  try {
    if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function loadSession(): { id: number; username: string; admin_status: AdminRole } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ id: number; username: string; admin_status: AdminRole } | null>(() => {
    if (!getToken()) return null;
    return loadSession();
  });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  const currentUser = session?.username ?? null;
  const currentUserId = session?.id ?? null;
  const currentRole = session?.admin_status ?? null;
  const isSuperAdmin = currentRole === 'super';

  const refreshUsers = async () => {
    if (!getToken() || !isSuperAdmin) {
      setUsers([]);
      return;
    }
    try {
      const list = await api.fetchAdmins();
      setUsers(list);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    if (session && isSuperAdmin) {
      void refreshUsers();
    } else {
      setUsers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, isSuperAdmin]);

  const login: AuthCtx['login'] = async (username, password) => {
    setLoading(true);
    try {
      const data = await api.login(username.trim(), password);
      setToken(data.token);
      const next = {
        id: data.admin.id,
        username: data.admin.username,
        admin_status: data.admin.admin_status,
      };
      setSession(next);
      saveSession(next);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      setToken(null);
    }
    setSession(null);
    saveSession(null);
    setUsers([]);
  };

  const createUser: AuthCtx['createUser'] = async (username, password) => {
    if (!isSuperAdmin) return { ok: false, error: 'notAuthorized' };
    const clean = username.trim();
    if (!clean || !password) return { ok: false, error: 'fillAllFields' };
    if (password.length < 4) return { ok: false, error: 'passwordTooShort' };
    try {
      await api.createAdmin({ username: clean, password, admin_status: 'admin' });
      await refreshUsers();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: mapApiError(err) };
    }
  };

  const changeOwnPassword: AuthCtx['changeOwnPassword'] = async (currentPassword, newPassword) => {
    if (!session) return { ok: false, error: 'wrongCurrentPassword' };
    if (newPassword.length < 4) return { ok: false, error: 'passwordTooShort' };
    try {
      // Verify current password via login
      await api.login(session.username, currentPassword);
      await api.updateAdminPassword(session.id, newPassword);
      return { ok: true };
    } catch {
      return { ok: false, error: 'wrongCurrentPassword' };
    }
  };

  const changeOwnUsername: AuthCtx['changeOwnUsername'] = async (newUsername) => {
    const clean = newUsername.trim();
    if (!session) return { ok: false, error: 'fillAllFields' };
    if (!clean) return { ok: false, error: 'fillAllFields' };
    if (isProtected(session.username) && clean.toLowerCase() !== PROTECTED_USERNAME) {
      return { ok: false, error: 'protectedAccount' };
    }
    try {
      const updated = await api.updateAdminUsername(session.id, clean);
      const next = {
        id: updated.id,
        username: updated.username,
        admin_status: updated.admin_status,
      };
      setSession(next);
      saveSession(next);
      await refreshUsers();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: mapApiError(err) };
    }
  };

  const deleteUser: AuthCtx['deleteUser'] = async (id) => {
    if (!isSuperAdmin) return { ok: false, error: 'notAuthorized' };
    if (id === session?.id) return { ok: false, error: 'cannotDeleteSelf' };
    const target = users.find((u) => u.id === id);
    if (!target) return { ok: false, error: 'notAuthorized' };
    if (isProtected(target.username)) return { ok: false, error: 'protectedAccount' };
    const superCount = users.filter((u) => u.admin_status === 'super').length;
    if (target.admin_status === 'super' && superCount <= 1) return { ok: false, error: 'cannotDeleteLast' };
    try {
      await api.deleteAdmin(id);
      await refreshUsers();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: mapApiError(err) };
    }
  };

  const setUserRole: AuthCtx['setUserRole'] = async (id, role) => {
    if (!isSuperAdmin) return { ok: false, error: 'notAuthorized' };
    const target = users.find((u) => u.id === id);
    if (!target) return { ok: false, error: 'notAuthorized' };
    if (isProtected(target.username)) return { ok: false, error: 'protectedAccount' };
    if (target.admin_status === 'super' && role === 'admin') {
      const superCount = users.filter((u) => u.admin_status === 'super').length;
      if (superCount <= 1) return { ok: false, error: 'cannotDemoteLastSuper' };
    }
    try {
      await api.updateAdminStatus(id, role);
      await refreshUsers();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: mapApiError(err) };
    }
  };

  return (
    <Ctx.Provider
      value={{
        currentUser,
        currentUserId,
        currentRole,
        isSuperAdmin,
        users,
        loading,
        login,
        logout,
        refreshUsers,
        createUser,
        changeOwnPassword,
        changeOwnUsername,
        deleteUser,
        setUserRole,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
