import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AdminRole, AdminUser } from '../types';
import { hashPassword, randomSalt } from '../utils';

const USERS_KEY = 'volidam-admin-users';
const SESSION_KEY = 'volidam-admin-session';

const DEFAULT_ADMIN = { username: 'amonovvv', password: '13012010' };

// This account can never be deleted, demoted, or renamed by anyone — including
// other super admins. It is the one identity that always keeps full control.
const PROTECTED_USERNAME = 'amonovvv';
function isProtected(username: string | null | undefined): boolean {
  return (username || '').toLowerCase() === PROTECTED_USERNAME;
}

interface AuthCtx {
  currentUser: string | null;
  currentRole: AdminRole | null;
  isSuperAdmin: boolean;
  users: AdminUser[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  changeOwnPassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  changeOwnUsername: (newUsername: string) => { ok: boolean; error?: string };
  deleteUser: (username: string) => { ok: boolean; error?: string };
  setUserRole: (username: string, role: AdminRole) => { ok: boolean; error?: string };
}

const Ctx = createContext<AuthCtx | null>(null);

function loadUsers(): AdminUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed: AdminUser[] = JSON.parse(raw);
      // migrate old records that don't have a role yet, and make sure the
      // protected account is always a super admin no matter what was stored.
      return parsed.map((u) => {
        const role: AdminRole = isProtected(u.username) ? 'super' : u.role || 'admin';
        return { ...u, role };
      });
    }
  } catch {
    /* ignore */
  }
  return [];
}
function saveUsers(users: AdminUser[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>(loadUsers);
  const [currentUser, setCurrentUser] = useState<string | null>(() => sessionStorageSafeGet());

  function sessionStorageSafeGet(): string | null {
    try {
      return sessionStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  }

  // seed default super-admin on first run
  useEffect(() => {
    if (users.length === 0) {
      (async () => {
        const salt = randomSalt();
        const passwordHash = await hashPassword(DEFAULT_ADMIN.password, salt);
        const seeded: AdminUser[] = [
          { username: DEFAULT_ADMIN.username, passwordHash, salt, role: 'super', createdAt: Date.now() },
        ];
        setUsers(seeded);
        saveUsers(seeded);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (users.length) saveUsers(users);
  }, [users]);

  const currentRole: AdminRole | null = currentUser
    ? users.find((u) => u.username === currentUser)?.role ?? null
    : null;
  const isSuperAdmin = currentRole === 'super';

  const login: AuthCtx['login'] = async (username, password) => {
    const user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) return false;
    const hash = await hashPassword(password, user.salt);
    if (hash === user.passwordHash) {
      setCurrentUser(user.username);
      try {
        sessionStorage.setItem(SESSION_KEY, user.username);
      } catch {
        /* ignore */
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  };

  const createUser: AuthCtx['createUser'] = async (username, password) => {
    if (!isSuperAdmin) return { ok: false, error: 'notAuthorized' };
    const clean = username.trim();
    if (!clean || !password) return { ok: false, error: 'fillAllFields' };
    if (password.length < 4) return { ok: false, error: 'passwordTooShort' };
    if (users.find((u) => u.username.toLowerCase() === clean.toLowerCase())) {
      return { ok: false, error: 'userExists' };
    }
    const salt = randomSalt();
    const passwordHash = await hashPassword(password, salt);
    setUsers((prev) => [...prev, { username: clean, passwordHash, salt, role: 'admin', createdAt: Date.now() }]);
    return { ok: true };
  };

  const changeOwnPassword: AuthCtx['changeOwnPassword'] = async (currentPassword, newPassword) => {
    if (!currentUser) return { ok: false, error: 'wrongCurrentPassword' };
    if (newPassword.length < 4) return { ok: false, error: 'passwordTooShort' };
    const user = users.find((u) => u.username === currentUser);
    if (!user) return { ok: false, error: 'wrongCurrentPassword' };
    const hash = await hashPassword(currentPassword, user.salt);
    if (hash !== user.passwordHash) return { ok: false, error: 'wrongCurrentPassword' };
    const salt = randomSalt();
    const passwordHash = await hashPassword(newPassword, salt);
    setUsers((prev) => prev.map((u) => (u.username === currentUser ? { ...u, passwordHash, salt } : u)));
    return { ok: true };
  };

  const changeOwnUsername: AuthCtx['changeOwnUsername'] = (newUsername) => {
    const clean = newUsername.trim();
    if (!currentUser) return { ok: false, error: 'fillAllFields' };
    if (!clean) return { ok: false, error: 'fillAllFields' };
    if (isProtected(currentUser) && clean.toLowerCase() !== PROTECTED_USERNAME) {
      return { ok: false, error: 'protectedAccount' };
    }
    if (users.find((u) => u.username.toLowerCase() === clean.toLowerCase() && u.username !== currentUser)) {
      return { ok: false, error: 'userExists' };
    }
    setUsers((prev) => prev.map((u) => (u.username === currentUser ? { ...u, username: clean } : u)));
    setCurrentUser(clean);
    try {
      sessionStorage.setItem(SESSION_KEY, clean);
    } catch {
      /* ignore */
    }
    return { ok: true };
  };

  const deleteUser: AuthCtx['deleteUser'] = (username) => {
    if (!isSuperAdmin) return { ok: false, error: 'notAuthorized' };
    if (isProtected(username)) return { ok: false, error: 'protectedAccount' };
    if (username === currentUser) return { ok: false, error: 'cannotDeleteSelf' };
    const target = users.find((u) => u.username === username);
    if (!target) return { ok: false, error: 'notAuthorized' };
    const superCount = users.filter((u) => u.role === 'super').length;
    if (target.role === 'super' && superCount <= 1) return { ok: false, error: 'cannotDeleteLast' };
    if (users.length <= 1) return { ok: false, error: 'cannotDeleteLast' };
    setUsers((prev) => prev.filter((u) => u.username !== username));
    return { ok: true };
  };

  const setUserRole: AuthCtx['setUserRole'] = (username, role) => {
    if (!isSuperAdmin) return { ok: false, error: 'notAuthorized' };
    if (isProtected(username)) return { ok: false, error: 'protectedAccount' };
    const target = users.find((u) => u.username === username);
    if (!target) return { ok: false, error: 'notAuthorized' };
    if (target.role === 'super' && role === 'admin') {
      const superCount = users.filter((u) => u.role === 'super').length;
      if (superCount <= 1) return { ok: false, error: 'cannotDemoteLastSuper' };
    }
    setUsers((prev) => prev.map((u) => (u.username === username ? { ...u, role } : u)));
    return { ok: true };
  };

  return (
    <Ctx.Provider
      value={{
        currentUser,
        currentRole,
        isSuperAdmin,
        users,
        login,
        logout,
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

