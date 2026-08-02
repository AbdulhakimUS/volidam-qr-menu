#!/usr/bin/env bash
set -e

if [ ! -f "package.json" ]; then
  echo "package.json not found here."
  echo "cd into your volidam-app project folder first, then run this script again."
  exit 1
fi

echo "Applying full patch (theme, preloader fix, 3 sections, admin roles + amonovvv protection)..."

cat > "index.html" << 'VOLIDAM_EOF_MARKER'
<!doctype html>
<html lang="ru" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0b0908" />
    <title>Volidam · QR Menu</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,600;1,700&family=Manrope:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

VOLIDAM_EOF_MARKER

mkdir -p "src"
cat > "src/App.tsx" << 'VOLIDAM_EOF_MARKER'
import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LangProvider } from './context/LangContext';
import { MenuProvider, useMenu } from './context/MenuContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Welcome from './components/Welcome';
import Preloader from './components/Preloader';
import MenuPage from './pages/MenuPage';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';

function AdminRoute() {
  const { currentUser } = useAuth();
  return currentUser ? <AdminPanel /> : <AdminLogin />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/admin" element={<AdminRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const MIN_PRELOADER_MS = 500;
const SAFETY_TIMEOUT_MS = 4000;

function BootGate({ children }: { children: React.ReactNode }) {
  const { items } = useMenu();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    const photoUrls = items.map((i) => i.photo).filter(Boolean) as string[];
    const imagePromises = photoUrls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        })
    );
    const fontsReady = (document as any).fonts?.ready?.catch?.(() => undefined) ?? Promise.resolve();
    const everything = Promise.all([...imagePromises, fontsReady]);
    const safety = new Promise<void>((resolve) => setTimeout(resolve, SAFETY_TIMEOUT_MS));

    Promise.race([everything, safety]).then(() => {
      if (cancelled) return;
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_PRELOADER_MS - elapsed);
      window.setTimeout(() => {
        if (!cancelled) setReady(true);
      }, wait);
    });

    return () => {
      cancelled = true;
    };
    // Only run once on boot — item photos already present at mount are what we preload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return <Preloader />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <MenuProvider>
            <BootGate>
              <HashRouter>
                <AppRoutes />
              </HashRouter>
            </BootGate>
          </MenuProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}

VOLIDAM_EOF_MARKER

mkdir -p "src/components"
cat > "src/components/Preloader.tsx" << 'VOLIDAM_EOF_MARKER'
import { TrayIcon } from './Icons';

export default function Preloader() {
  return (
    <div className="preloader">
      <div className="lattice-strip" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
      <div className="preloader-spinner">
        <div className="preloader-ring" />
        <TrayIcon className="tray preloader-tray" />
      </div>
      <div className="preloader-brand">Volidam</div>
      <div className="preloader-sub">Algoritm</div>
      <div className="lattice-strip" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
    </div>
  );
}

VOLIDAM_EOF_MARKER

mkdir -p "src/components"
cat > "src/components/Welcome.tsx" << 'VOLIDAM_EOF_MARKER'
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { TrayIcon } from './Icons';
import { CATEGORY_GROUPS } from '../data/categories';
import type { Lang } from '../types';

export default function Welcome() {
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const langs: Lang[] = ['ru', 'uz', 'en'];

  const goToGroup = (groupKey: string) => {
    navigate('/menu', { state: { group: groupKey } });
  };

  return (
    <div className="welcome">
      <div className="lattice-strip" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
      <div className="brand-mark">
        <TrayIcon className="tray" />
        <div className="brand-name">Volidam</div>
        <div className="brand-sub">Algoritm</div>
      </div>
      <h1 className="welcome-greet">{t('welcomeTitle')}</h1>
      <p className="welcome-sub" dangerouslySetInnerHTML={{ __html: t('welcomeSub') }} />

      <div className="welcome-sections">
        {CATEGORY_GROUPS.map((g, idx) => (
          <button key={g.key} className="welcome-section-btn" onClick={() => goToGroup(g.key)}>
            <span className="label">
              <span className="num">{idx + 1}</span>
              <span>{g[lang]}</span>
            </span>
            <span className="arrow">→</span>
          </button>
        ))}
      </div>

      <div className="welcome-langs">
        {langs.map((l) => (
          <button key={l} className={`lang-pill ${lang === l ? 'active' : ''}`} onClick={() => setLang(l)}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="lattice-strip" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
    </div>
  );
}

VOLIDAM_EOF_MARKER

mkdir -p "src/context"
cat > "src/context/AuthContext.tsx" << 'VOLIDAM_EOF_MARKER'
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

VOLIDAM_EOF_MARKER

mkdir -p "src/context"
cat > "src/context/ThemeContext.tsx" << 'VOLIDAM_EOF_MARKER'
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeMode } from '../types';

interface ThemeCtx {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = 'volidam-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    // Default theme for every new visitor is light.
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  };
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return <Ctx.Provider value={{ theme, setTheme, toggleTheme }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

VOLIDAM_EOF_MARKER

mkdir -p "src/data"
cat > "src/data/categories.ts" << 'VOLIDAM_EOF_MARKER'
import type { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { tag: 'salatlar', ru: 'Салатлар', uz: 'Salatlar', en: 'Salads' },
  { tag: 'non', ru: 'Нон ассорти', uz: 'Non assorti', en: 'Bread' },
  { tag: 'sovuqgazak', ru: 'Холодные закуски', uz: 'Sovuq gazaklar', en: 'Cold appetizers' },
  { tag: 'somsa', ru: 'Сомса', uz: 'Somsa', en: 'Somsa' },
  { tag: 'souslar', ru: 'Соуслар', uz: 'Souslar', en: 'Sauces' },
  { tag: 'yevropa', ru: 'Европейские блюда', uz: "Yevropa taomlari", en: 'European dishes' },
  { tag: 'uygur', ru: 'Уйгурские блюда', uz: "Uyg'ur taomlari", en: 'Uyghur dishes' },
  { tag: 'buyurtma', ru: 'Блюда на заказ', uz: 'Buyurtma taomlar', en: 'Order dishes' },
  { tag: 'kabob', ru: 'Кабоблар', uz: 'Kabob', en: 'Kebabs' },
  { tag: 'barbekyu', ru: 'Барбекю', uz: 'Barbekyu', en: 'BBQ' },
  { tag: 'baliq', ru: 'Рыба', uz: 'Baliq', en: 'Fish' },
  { tag: 'issiqichimlik', ru: 'Горячие напитки', uz: 'Issiq ichimliklar', en: 'Hot drinks' },
  { tag: 'salqinichimlik', ru: 'Холодные напитки', uz: 'Salqin ichimliklar', en: 'Cold drinks' },
  { tag: 'muzqaymoq', ru: 'Мороженое', uz: 'Muzqaymoq', en: 'Ice cream' },
];

export interface CategoryGroup {
  key: string;
  tags: string[];
  ru: string;
  uz: string;
  en: string;
}

// Top-level sections shown on the welcome screen. Any category tag not listed
// here (e.g. a brand-new hashtag created later from the admin panel) falls
// back to the first group ("milliy") so nothing ever gets lost.
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    key: 'milliy',
    tags: ['salatlar', 'non', 'sovuqgazak', 'somsa', 'souslar', 'uygur', 'buyurtma', 'kabob', 'barbekyu', 'baliq'],
    ru: 'Миллий таом',
    uz: 'Milliy taom',
    en: 'National dishes',
  },
  {
    key: 'yevropa',
    tags: ['yevropa'],
    ru: 'Европа таом',
    uz: 'Yevropa taom',
    en: 'European dishes',
  },
  {
    key: 'bar',
    tags: ['issiqichimlik', 'salqinichimlik', 'muzqaymoq'],
    ru: 'Бар и десерты',
    uz: 'Bar va desertlar',
    en: 'Bar & desserts',
  },
];

export function groupForTag(tag: string): CategoryGroup {
  return CATEGORY_GROUPS.find((g) => g.tags.includes(tag)) || CATEGORY_GROUPS[0];
}


VOLIDAM_EOF_MARKER

mkdir -p "src/i18n"
cat > "src/i18n/strings.ts" << 'VOLIDAM_EOF_MARKER'
import type { Lang } from '../types';

export const STR: Record<Lang, Record<string, string>> = {
  ru: {
    welcomeTitle: 'Добро пожаловать',
    welcomeSub: 'Национальная и европейская кухня в районе <b>Алгоритм</b>. Откройте меню, чтобы посмотреть блюда и напитки.',
    enter: 'Открыть меню',
    search: 'Поиск блюд...',
    all: 'Все',
    empty: 'Ничего не найдено',
    weight: 'Вес',
    admin: 'Админ',
    adminLogin: 'Вход в панель',
    adminLoginSub: 'Только для сотрудников Volidam',
    login: 'Логин',
    password: 'Пароль',
    enterBtn: 'Войти',
    wrongCreds: 'Неверный логин или пароль',
    backToMenu: 'К меню',
    logout: 'Выйти',
    addItem: 'Добавить блюдо',
    editItem: 'Редактировать блюдо',
    name: 'Название',
    price: 'Цена (сум)',
    photo: 'Фото',
    hashtag: 'Хештег (категория)',
    hashtagHint: "Например: salatlar, kabob, uygur — блюдо попадёт в эту категорию автоматически",
    weightOpt: 'Вес / объём (необязательно)',
    save: 'Сохранить',
    cancel: 'Отмена',
    uploadPhoto: 'Загрузить фото или вставить ссылку',
    photoUrl: 'Ссылка на фото (URL)',
    delete: 'Удалить',
    edit: 'Редактировать',
    confirmDelete: 'Удалить это блюдо?',
    saved: 'Сохранено',
    deleted: 'Удалено',
    fillRequired: 'Заполните название, цену и хештег',
    itemsCount: 'позиций',
    menuManage: 'Меню',
    allItems: 'Все блюда',
    theme: 'Тема',
    light: 'Светлая',
    dark: 'Тёмная',
    tabMenu: 'Меню',
    tabUsers: 'Админы',
    users: 'Администраторы',
    addUser: 'Добавить админа',
    newUsername: 'Новый логин',
    newPassword: 'Новый пароль',
    createUser: 'Создать',
    userExists: 'Такой логин уже занят',
    userCreated: 'Админ создан',
    changePassword: 'Сменить свой пароль',
    currentPassword: 'Текущий пароль',
    newPasswordLabel: 'Новый пароль',
    changeUsername: 'Сменить свой логин',
    newUsernameLabel: 'Новый логин',
    apply: 'Применить',
    passwordChanged: 'Пароль изменён',
    usernameChanged: 'Логин изменён',
    wrongCurrentPassword: 'Неверный текущий пароль',
    cannotDeleteSelf: 'Нельзя удалить свой аккаунт здесь — используйте выход',
    cannotDeleteLast: 'Нельзя удалить последнего администратора',
    userDeleted: 'Админ удалён',
    loggedInAs: 'Вы вошли как',
    fillAllFields: 'Заполните все поля',
    passwordTooShort: 'Пароль должен быть не короче 4 символов',
    notAuthorized: 'Только главный админ может это делать',
    role: 'Роль',
    roleSuper: 'Главный админ',
    roleAdmin: 'Админ',
    makeSuperAdmin: 'Сделать главным',
    removeSuperAdmin: 'Снять права главного',
    cannotDemoteLastSuper: 'Нельзя снять права у последнего главного админа',
    protectedAccount: 'Этот аккаунт защищён — его нельзя удалить, понизить или переименовать',
    onlySuperCanManage: 'Только главный админ (amonovvv или тот, кого он назначит) может добавлять, удалять и назначать других админов. Обычные админы могут редактировать меню и менять свой логин/пароль.',
  },
  uz: {
    welcomeTitle: 'Xush kelibsiz',
    welcomeSub: "<b>Algoritm</b> hududidagi milliy va yevropa taomlari. Menyuni ochib, taom va ichimliklarni ko'ring.",
    enter: 'Menyuni ochish',
    search: 'Taom qidirish...',
    all: 'Barchasi',
    empty: 'Hech narsa topilmadi',
    weight: "Og'irligi",
    admin: 'Admin',
    adminLogin: 'Panelga kirish',
    adminLoginSub: 'Faqat Volidam xodimlari uchun',
    login: 'Login',
    password: 'Parol',
    enterBtn: 'Kirish',
    wrongCreds: 'Login yoki parol xato',
    backToMenu: 'Menyuga',
    logout: 'Chiqish',
    addItem: "Taom qo'shish",
    editItem: 'Taomni tahrirlash',
    name: 'Nomi',
    price: 'Narxi (so\'m)',
    photo: 'Rasm',
    hashtag: 'Xeshteg (kategoriya)',
    hashtagHint: "Masalan: salatlar, kabob, uygur — taom shu kategoriyaga avtomatik tushadi",
    weightOpt: "Og'irligi / hajmi (ixtiyoriy)",
    save: 'Saqlash',
    cancel: 'Bekor qilish',
    uploadPhoto: "Rasm yuklang yoki havola qo'ying",
    photoUrl: 'Rasm havolasi (URL)',
    delete: "O'chirish",
    edit: 'Tahrirlash',
    confirmDelete: "Bu taomni o'chirasizmi?",
    saved: 'Saqlandi',
    deleted: "O'chirildi",
    fillRequired: "Nomi, narxi va xeshtegni to'ldiring",
    itemsCount: 'ta taom',
    menuManage: 'Menyu',
    allItems: 'Barcha taomlar',
    theme: 'Mavzu',
    light: "Yorug'",
    dark: 'Qorong\'u',
    tabMenu: 'Menyu',
    tabUsers: 'Adminlar',
    users: 'Administratorlar',
    addUser: "Admin qo'shish",
    newUsername: 'Yangi login',
    newPassword: 'Yangi parol',
    createUser: 'Yaratish',
    userExists: 'Bu login band',
    userCreated: 'Admin yaratildi',
    changePassword: 'Parolni almashtirish',
    currentPassword: 'Joriy parol',
    newPasswordLabel: 'Yangi parol',
    changeUsername: 'Loginni almashtirish',
    newUsernameLabel: 'Yangi login',
    apply: "Qo'llash",
    passwordChanged: "Parol o'zgartirildi",
    usernameChanged: "Login o'zgartirildi",
    wrongCurrentPassword: 'Joriy parol xato',
    cannotDeleteSelf: "O'z hisobingizni shu yerdan o'chira olmaysiz — chiqishdan foydalaning",
    cannotDeleteLast: "Oxirgi adminni o'chirib bo'lmaydi",
    userDeleted: "Admin o'chirildi",
    loggedInAs: 'Siz tizimga kirdingiz',
    fillAllFields: "Barcha maydonlarni to'ldiring",
    passwordTooShort: "Parol kamida 4 ta belgidan iborat bo'lishi kerak",
    notAuthorized: "Buni faqat bosh admin qila oladi",
    role: 'Rol',
    roleSuper: 'Bosh admin',
    roleAdmin: 'Admin',
    makeSuperAdmin: 'Bosh admin qilish',
    removeSuperAdmin: 'Bosh admin huquqini olish',
    cannotDemoteLastSuper: "Oxirgi bosh adminning huquqini olib bo'lmaydi",
    protectedAccount: "Bu hisob himoyalangan — uni o'chirib, pasaytirib yoki nomini o'zgartirib bo'lmaydi",
    onlySuperCanManage: "Faqat bosh admin (amonovvv yoki u tayinlagan admin) boshqa adminlarni qo'sha, o'chira va tayinlay oladi. Oddiy adminlar menyuni tahrirlashi va o'z login/parolini almashtirishi mumkin.",
  },
  en: {
    welcomeTitle: 'Welcome',
    welcomeSub: 'National and European cuisine in the <b>Algoritm</b> area. Open the menu to see dishes and drinks.',
    enter: 'Open menu',
    search: 'Search dishes...',
    all: 'All',
    empty: 'Nothing found',
    weight: 'Weight',
    admin: 'Admin',
    adminLogin: 'Panel login',
    adminLoginSub: 'Volidam staff only',
    login: 'Username',
    password: 'Password',
    enterBtn: 'Log in',
    wrongCreds: 'Wrong username or password',
    backToMenu: 'Back to menu',
    logout: 'Log out',
    addItem: 'Add dish',
    editItem: 'Edit dish',
    name: 'Name',
    price: 'Price (UZS)',
    photo: 'Photo',
    hashtag: 'Hashtag (category)',
    hashtagHint: 'E.g. salatlar, kabob, uygur — the dish will land in that category automatically',
    weightOpt: 'Weight / volume (optional)',
    save: 'Save',
    cancel: 'Cancel',
    uploadPhoto: 'Upload photo or paste a link',
    photoUrl: 'Photo link (URL)',
    delete: 'Delete',
    edit: 'Edit',
    confirmDelete: 'Delete this dish?',
    saved: 'Saved',
    deleted: 'Deleted',
    fillRequired: 'Fill in name, price and hashtag',
    itemsCount: 'items',
    menuManage: 'Menu',
    allItems: 'All dishes',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    tabMenu: 'Menu',
    tabUsers: 'Admins',
    users: 'Administrators',
    addUser: 'Add admin',
    newUsername: 'New username',
    newPassword: 'New password',
    createUser: 'Create',
    userExists: 'This username is taken',
    userCreated: 'Admin created',
    changePassword: 'Change your password',
    currentPassword: 'Current password',
    newPasswordLabel: 'New password',
    changeUsername: 'Change your username',
    newUsernameLabel: 'New username',
    apply: 'Apply',
    passwordChanged: 'Password changed',
    usernameChanged: 'Username changed',
    wrongCurrentPassword: 'Current password is wrong',
    cannotDeleteSelf: "You can't delete your own account here — use log out",
    cannotDeleteLast: 'Cannot delete the last administrator',
    userDeleted: 'Admin deleted',
    loggedInAs: 'Logged in as',
    fillAllFields: 'Fill in all fields',
    passwordTooShort: 'Password must be at least 4 characters',
    notAuthorized: 'Only the super admin can do this',
    role: 'Role',
    roleSuper: 'Super admin',
    roleAdmin: 'Admin',
    makeSuperAdmin: 'Make super admin',
    removeSuperAdmin: 'Remove super admin rights',
    cannotDemoteLastSuper: 'Cannot remove rights from the last super admin',
    protectedAccount: 'This account is protected — it cannot be deleted, demoted or renamed',
    onlySuperCanManage: 'Only the super admin (amonovvv, or whoever they promote) can add, delete or promote other admins. Regular admins can edit the menu and change their own username/password.',
  },
};

VOLIDAM_EOF_MARKER

mkdir -p "src/pages"
cat > "src/pages/AdminPanel.tsx" << 'VOLIDAM_EOF_MARKER'
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { useMenu } from '../context/MenuContext';
import type { MenuItem } from '../types';
import { fmtPrice, slugifyTag } from '../utils';
import { DishIcon, EditIcon, TrashIcon } from '../components/Icons';

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const show = (m: string) => {
    setMsg(m);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 1800);
  };
  return { msg, show };
}

export default function AdminPanel() {
  const { t } = useLang();
  const { currentUser, logout } = useAuth();
  const [tab, setTab] = useState<'menu' | 'users'>('menu');
  const { msg, show } = useToast();

  if (!currentUser) {
    // Should not normally happen (route guard redirects), but keep as a safe fallback.
    return null;
  }

  return (
    <div className="admin-shell">
      <div className="admin-header">
        <h1>{t('menuManage')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/menu" className="btn-secondary">
            {t('backToMenu')}
          </Link>
          <button className="btn-secondary" onClick={logout}>
            {t('logout')}
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'menu' ? 'active' : ''}`} onClick={() => setTab('menu')}>
          {t('tabMenu')}
        </button>
        <button className={`admin-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          {t('tabUsers')}
        </button>
      </div>

      {tab === 'menu' ? <MenuTab onToast={show} /> : <UsersTab onToast={show} />}

      <div className={`toast ${msg ? 'show' : ''}`}>{msg}</div>
    </div>
  );
}

/* ============================= MENU TAB ============================= */

function emptyForm() {
  return { id: '', name: '', price: '', weight: '', tag: '', photo: null as string | null };
}

function MenuTab({ onToast }: { onToast: (m: string) => void }) {
  const { t, lang } = useLang();
  const { items, categories, addItem, updateItem, deleteItem } = useMenu();
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const editing = !!form.id;

  const startEdit = (it: MenuItem) => {
    setForm({ id: it.id, name: it.name, price: String(it.price), weight: it.weight || '', tag: it.tag, photo: it.photo || null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const resetForm = () => setForm(emptyForm());

  const handlePhotoFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 900;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setForm((f) => ({ ...f, photo: dataUrl }));
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const price = Number(form.price);
    const tag = slugifyTag(form.tag);
    if (!name || !price || !tag) {
      setError(true);
      return;
    }
    setError(false);
    const payload = { name, price, weight: form.weight.trim(), tag, photo: form.photo };
    if (editing) updateItem(form.id, payload);
    else addItem(payload);
    onToast(t('saved'));
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    deleteItem(id);
    onToast(t('deleted'));
  };

  const list = items
    .filter((it) => !search.trim() || it.name.toLowerCase().includes(search.trim().toLowerCase()))
    .slice()
    .sort((a, b) => a.tag.localeCompare(b.tag) || a.name.localeCompare(b.name));

  const catLabel = (tag: string) => {
    const c = categories.find((c) => c.tag === tag);
    return c ? c[lang as keyof typeof c] : tag;
  };

  return (
    <div className="admin-grid">
      <div className="panel-box">
        <h3>{editing ? t('editItem') : t('addItem')}</h3>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{t('name')} *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('name')} />
          </div>
          <div className="field">
            <label>{t('price')} *</label>
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="45000"
            />
          </div>
          <div className="field">
            <label>{t('weightOpt')}</label>
            <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="250 гр" />
          </div>
          <div className="field">
            <label>{t('hashtag')} *</label>
            <input
              list="tagList"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              placeholder="salatlar"
            />
            <datalist id="tagList">
              {categories.map((c) => (
                <option key={c.tag} value={c.tag} />
              ))}
            </datalist>
            <div className="datalist-hint">{t('hashtagHint')}</div>
          </div>
          <div className="field">
            <label>{t('photo')}</label>
            <div
              className="photo-upload"
              onClick={() => fileInput.current?.click()}
            >
              {form.photo && <img src={form.photo} alt="" />}
              <div>{t('uploadPhoto')}</div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoFile(file);
                }}
              />
            </div>
            <input
              style={{ marginTop: 8 }}
              placeholder={t('photoUrl')}
              value={form.photo && form.photo.startsWith('http') ? form.photo : ''}
              onChange={(e) => setForm({ ...form, photo: e.target.value || null })}
            />
          </div>
          {error && <div className="field-error">{t('fillRequired')}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button type="submit" className="btn-primary">
              {t('save')}
            </button>
            {editing && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                {t('cancel')}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="panel-box">
        <h3>
          {t('allItems')} — {items.length} {t('itemsCount')}
        </h3>
        <div className="field admin-search">
          <input placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="admin-list">
          {list.map((it) => (
            <div className="admin-item" key={it.id}>
              <div className="thumb">{it.photo ? <img src={it.photo} alt="" /> : <DishIcon />}</div>
              <div className="info">
                <div className="n">{it.name}</div>
                <div className="m">
                  <span>{fmtPrice(it.price, lang)}</span>
                  <span>·</span>
                  <span>{catLabel(it.tag)}</span>
                </div>
              </div>
              <div className="acts">
                <button className="icon-btn" title={t('edit')} onClick={() => startEdit(it)}>
                  <EditIcon />
                </button>
                <button className="icon-btn" title={t('delete')} onClick={() => handleDelete(it.id)}>
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================= USERS TAB ============================= */

function UsersTab({ onToast }: { onToast: (m: string) => void }) {
  const { t } = useLang();
  const {
    currentUser,
    isSuperAdmin,
    users,
    createUser,
    changeOwnPassword,
    changeOwnUsername,
    deleteUser,
    setUserRole,
  } = useAuth();

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [curPass, setCurPass] = useState('');
  const [nextPass, setNextPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);

  const [nextUsername, setNextUsername] = useState('');
  const [unameError, setUnameError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createUser(newUsername, newPassword);
    if (!res.ok) {
      setCreateError(t(res.error || 'fillAllFields'));
      return;
    }
    setCreateError(null);
    setNewUsername('');
    setNewPassword('');
    onToast(t('userCreated'));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await changeOwnPassword(curPass, nextPass);
    if (!res.ok) {
      setPassError(t(res.error || 'wrongCurrentPassword'));
      return;
    }
    setPassError(null);
    setCurPass('');
    setNextPass('');
    onToast(t('passwordChanged'));
  };

  const handleChangeUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const res = changeOwnUsername(nextUsername);
    if (!res.ok) {
      setUnameError(t(res.error || 'fillAllFields'));
      return;
    }
    setUnameError(null);
    setNextUsername('');
    onToast(t('usernameChanged'));
  };

  const handleDelete = (username: string) => {
    if (!confirm(`${t('delete')} "${username}"?`)) return;
    const res = deleteUser(username);
    if (!res.ok) {
      onToast(t(res.error || 'cannotDeleteSelf'));
      return;
    }
    onToast(t('userDeleted'));
  };

  const handleToggleRole = (username: string, nextRole: 'super' | 'admin') => {
    const res = setUserRole(username, nextRole);
    if (!res.ok) {
      onToast(t(res.error || 'notAuthorized'));
      return;
    }
    onToast(t('saved'));
  };

  return (
    <div className="admin-grid">
      <div className="panel-box">
        {!isSuperAdmin && (
          <>
            <div className="field-error" style={{ marginBottom: 16 }}>
              {t('onlySuperCanManage')}
            </div>
            <div className="hr-space" />
          </>
        )}

        {isSuperAdmin && (
          <>
            <h3>{t('addUser')}</h3>
            <form onSubmit={handleCreate}>
              <div className="field">
                <label>{t('newUsername')}</label>
                <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
              </div>
              <div className="field">
                <label>{t('newPassword')}</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              {createError && <div className="field-error">{createError}</div>}
              <button type="submit" className="btn-primary">
                {t('createUser')}
              </button>
            </form>

            <div className="hr-space" />
          </>
        )}

        <h3>{t('changeUsername')}</h3>
        <form onSubmit={handleChangeUsername}>
          <div className="field">
            <label>{t('newUsernameLabel')}</label>
            <input value={nextUsername} onChange={(e) => setNextUsername(e.target.value)} placeholder={currentUser || ''} />
          </div>
          {unameError && <div className="field-error">{unameError}</div>}
          <button type="submit" className="btn-primary">
            {t('apply')}
          </button>
        </form>

        <div className="hr-space" />

        <h3>{t('changePassword')}</h3>
        <form onSubmit={handleChangePassword}>
          <div className="field">
            <label>{t('currentPassword')}</label>
            <input type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('newPasswordLabel')}</label>
            <input type="password" value={nextPass} onChange={(e) => setNextPass(e.target.value)} />
          </div>
          {passError && <div className="field-error">{passError}</div>}
          <button type="submit" className="btn-primary">
            {t('apply')}
          </button>
        </form>
      </div>

      <div className="panel-box">
        <h3>
          {t('users')} — {users.length}
        </h3>
        {users.map((u) => {
          const protectedUser = u.username.toLowerCase() === 'amonovvv';
          return (
            <div className="user-row" key={u.username}>
              <div>
                <span className="uname">{u.username}</span>
                {u.username === currentUser && <span className="you">({t('loggedInAs').split(' ').pop()})</span>}
                <span className="you" style={{ color: u.role === 'super' ? 'var(--gold-light)' : 'var(--muted)' }}>
                  {' '}
                  · {u.role === 'super' ? t('roleSuper') : t('roleAdmin')}
                  {protectedUser ? ' 🛡' : ''}
                </span>
              </div>
              {isSuperAdmin && u.username !== currentUser && !protectedUser && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: '8px 12px', fontSize: 12.5 }}
                    onClick={() => handleToggleRole(u.username, u.role === 'super' ? 'admin' : 'super')}
                  >
                    {u.role === 'super' ? t('removeSuperAdmin') : t('makeSuperAdmin')}
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(u.username)}>
                    {t('delete')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

VOLIDAM_EOF_MARKER

mkdir -p "src/pages"
cat > "src/pages/MenuPage.tsx" << 'VOLIDAM_EOF_MARKER'
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';
import { useMenu } from '../context/MenuContext';
import { CATEGORY_GROUPS, groupForTag } from '../data/categories';
import type { Lang, MenuItem } from '../types';
import { TrayIcon, SearchIcon, EmptyIcon, SunIcon, MoonIcon } from '../components/Icons';
import ItemCard from '../components/ItemCard';
import ItemModal from '../components/ItemModal';

interface NavState {
  group?: string;
}

export default function MenuPage() {
  const { lang, setLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { items, categories } = useMenu();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const groupRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const langs: Lang[] = ['ru', 'uz', 'en'];

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, query]);

  const grouped = useMemo(() => {
    const g = new Map<string, MenuItem[]>();
    filtered.forEach((it) => {
      if (!g.has(it.tag)) g.set(it.tag, []);
      g.get(it.tag)!.push(it);
    });
    return g;
  }, [filtered]);

  const activeCats = categories.filter((c) => items.some((i) => i.tag === c.tag));

  // Scroll to the group requested from the Welcome screen, once sections exist.
  useEffect(() => {
    const state = location.state as NavState | null;
    const groupKey = state?.group;
    if (!groupKey) return;
    const raf = requestAnimationFrame(() => {
      const el = groupRefs.current.get(groupKey);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 132;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, items.length]);

  const scrollToCategory = (tag: string) => {
    if (tag === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = sectionRefs.current.get(tag);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 132;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-mini">
            <TrayIcon className="tray" />
            <span className="word">Volidam</span>
          </div>
          <div className="top-actions">
            <div className="lang-switch">
              {langs.map((l) => (
                <button key={l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="toggle theme">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
        <div className="search-row">
          <div className="search-box">
            <SearchIcon />
            <input placeholder={t('search')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
        <div className="cat-row">
          <button className="chip" onClick={() => scrollToCategory('all')}>
            {t('all')}
          </button>
          {activeCats.map((c) => (
            <button key={c.tag} className="chip" onClick={() => scrollToCategory(c.tag)}>
              {c[lang]}
            </button>
          ))}
        </div>
      </header>

      <div className="menu-wrap">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <EmptyIcon />
            <div>{t('empty')}</div>
          </div>
        ) : (
          CATEGORY_GROUPS.map((group) => {
            const catsInGroup = activeCats.filter((c) => groupForTag(c.tag).key === group.key && grouped.get(c.tag)?.length);
            if (catsInGroup.length === 0) return null;
            return (
              <div
                key={group.key}
                ref={(el) => {
                  if (el) groupRefs.current.set(group.key, el);
                }}
              >
                <div className="group-title">
                  {group[lang]}
                  <span className="bar" />
                </div>
                {catsInGroup.map((c) => (
                  <div
                    key={c.tag}
                    ref={(el) => {
                      if (el) sectionRefs.current.set(c.tag, el);
                    }}
                  >
                    <div className="section-title">{c[lang]}</div>
                    <div className="grid">
                      {grouped.get(c.tag)!.map((it) => (
                        <ItemCard key={it.id} item={it} onClick={() => setActiveItem(it)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      <div className="site-footer">
        Volidam · Algoritm &nbsp;·&nbsp; <Link to="/admin">{t('admin')}</Link>
      </div>

      {activeItem && <ItemModal item={activeItem} onClose={() => setActiveItem(null)} />}
    </div>
  );
}

VOLIDAM_EOF_MARKER

mkdir -p "src/styles"
cat > "src/styles/global.css" << 'VOLIDAM_EOF_MARKER'
:root {
  --radius: 16px;
  --shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
}

[data-theme='dark'] {
  --bg: #0b0908;
  --bg-soft: #141110;
  --panel: #181412;
  --panel-2: #1f1a17;
  --gold: #c9a24a;
  --gold-light: #e8cf8f;
  --gold-dim: #8a713a;
  --red: #a4192c;
  --red-light: #c9354a;
  --cream: #f3ead9;
  --muted: #a89a86;
  --line: #2b241f;
  --overlay: rgba(6, 5, 4, 0.72);
}

[data-theme='light'] {
  --bg: #faf6ee;
  --bg-soft: #f2ebda;
  --panel: #fffdf8;
  --panel-2: #f3ead9;
  --gold: #a9812f;
  --gold-light: #8a6a22;
  --gold-dim: #cbb178;
  --red: #a4192c;
  --red-light: #8a1424;
  --cream: #2a2117;
  --muted: #7a6d5a;
  --line: #e6dcc4;
  --overlay: rgba(40, 32, 20, 0.4);
}

* {
  box-sizing: border-box;
}
html,
body,
#root {
  margin: 0;
  padding: 0;
  min-height: 100%;
}
body {
  background: var(--bg);
  color: var(--cream);
  font-family: 'Manrope', sans-serif;
  -webkit-font-smoothing: antialiased;
  transition: background 0.25s ease, color 0.25s ease;
}
a {
  color: inherit;
}
button {
  font-family: inherit;
}

/* ---------- lattice signature pattern ---------- */
.lattice-strip {
  height: 26px;
  width: 100%;
  background-image: linear-gradient(135deg, transparent 40%, var(--gold-dim) 40%, var(--gold-dim) 46%, transparent 46%),
    linear-gradient(45deg, transparent 40%, var(--gold-dim) 40%, var(--gold-dim) 46%, transparent 46%);
  background-size: 26px 26px;
  opacity: 0.55;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ---------- WELCOME ---------- */
.welcome {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  background: radial-gradient(ellipse at 50% 0%, rgba(164, 25, 44, 0.18), transparent 55%),
    radial-gradient(ellipse at 50% 100%, rgba(201, 162, 74, 0.1), transparent 55%), var(--bg);
  padding: 40px 24px;
}
.brand-mark {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-bottom: 34px;
}
.brand-mark .tray {
  width: 46px;
  height: 46px;
  margin-bottom: 10px;
  color: var(--gold);
}
.brand-name {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-weight: 700;
  font-size: clamp(48px, 11vw, 76px);
  background: linear-gradient(180deg, var(--red-light), var(--red) 70%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  line-height: 1;
  letter-spacing: 0.5px;
}
.brand-sub {
  font-size: 13px;
  letter-spacing: 0.55em;
  text-transform: uppercase;
  color: var(--gold);
  margin-top: 8px;
  font-weight: 600;
}
.welcome-greet {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  font-size: clamp(22px, 5vw, 30px);
  color: var(--cream);
  margin: 0 0 6px;
}
.welcome-sub {
  color: var(--muted);
  font-size: 14.5px;
  letter-spacing: 0.02em;
  max-width: 420px;
  line-height: 1.6;
  margin: 0 0 34px;
}
.welcome-sub b {
  color: var(--gold-light);
  font-weight: 700;
}
.enter-btn {
  background: linear-gradient(135deg, var(--gold-light), var(--gold) 60%, var(--gold-dim));
  color: #1b1409;
  border: none;
  padding: 15px 40px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 15px;
  letter-spacing: 0.03em;
  cursor: pointer;
  box-shadow: 0 12px 30px rgba(201, 162, 74, 0.28);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.enter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 36px rgba(201, 162, 74, 0.4);
}
.welcome-langs {
  margin-top: 26px;
  display: flex;
  gap: 10px;
}
.lang-pill {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: 0.2s;
}
.lang-pill.active {
  color: #1b1409;
  background: var(--gold);
  border-color: var(--gold);
}

/* ---------- HEADER (menu view) ---------- */
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.topbar-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 14px 18px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.brand-mini {
  display: flex;
  align-items: center;
  gap: 9px;
}
.brand-mini .tray {
  width: 24px;
  height: 24px;
  color: var(--gold);
}
.brand-mini .word {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-weight: 700;
  font-size: 21px;
  color: var(--red-light);
}
.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.theme-toggle {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.theme-toggle svg {
  width: 17px;
  height: 17px;
}
.lang-switch {
  display: flex;
  gap: 6px;
}
.lang-switch button {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.lang-switch button.active {
  background: var(--gold);
  color: #1b1409;
  border-color: var(--gold);
}

.search-row {
  max-width: 1080px;
  margin: 0 auto;
  padding: 14px 18px 6px;
}
.search-box {
  position: relative;
}
.search-box input {
  width: 100%;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--cream);
  padding: 13px 16px 13px 42px;
  border-radius: 12px;
  font-size: 14.5px;
  outline: none;
}
.search-box input::placeholder {
  color: var(--muted);
}
.search-box input:focus {
  border-color: var(--gold-dim);
}
.search-box svg {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 17px;
  height: 17px;
  color: var(--muted);
}

.cat-row {
  max-width: 1080px;
  margin: 0 auto;
  padding: 12px 18px 16px;
  display: flex;
  gap: 9px;
  overflow-x: auto;
  scrollbar-width: none;
}
.cat-row::-webkit-scrollbar {
  display: none;
}
.chip {
  flex: none;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--muted);
  padding: 9px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: 0.18s;
}
.chip.active {
  background: linear-gradient(135deg, var(--red-light), var(--red));
  color: #fff;
  border-color: transparent;
}

/* ---------- MENU GRID ---------- */
.menu-wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 6px 18px 90px;
  flex: 1;
  width: 100%;
}
.section-title {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 22px;
  color: var(--gold-light);
  margin: 26px 2px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  scroll-margin-top: 150px;
}
.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--line), transparent);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease;
  display: flex;
  flex-direction: column;
}
.card:hover {
  transform: translateY(-3px);
  border-color: var(--gold-dim);
}
.card-photo {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: linear-gradient(135deg, var(--panel-2), var(--bg-soft));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.card-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card-photo svg {
  width: 34px;
  height: 34px;
  color: var(--gold-dim);
}
.card-body {
  padding: 12px 13px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.card-name {
  font-weight: 700;
  font-size: 14.5px;
  color: var(--cream);
  line-height: 1.3;
}
.card-weight {
  font-size: 11.5px;
  color: var(--muted);
}
.card-bottom {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
}
.card-price {
  font-weight: 800;
  color: var(--gold-light);
  font-size: 14.5px;
}
.card-tag {
  font-size: 9.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--gold-dim);
  border: 1px solid var(--line);
  padding: 3px 7px;
  border-radius: 6px;
}

@media (max-width: 560px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .card-body {
    padding: 9px 10px 11px;
    gap: 4px;
  }
  .card-name {
    font-size: 12.5px;
    line-height: 1.25;
  }
  .card-weight {
    font-size: 10.5px;
  }
  .card-price {
    font-size: 12.5px;
  }
  .card-tag {
    font-size: 8.5px;
    padding: 2px 5px;
  }
  .section-title {
    font-size: 18px;
  }
  .group-title {
    font-size: 21px;
  }
}

.empty-state {
  text-align: center;
  padding: 70px 20px;
  color: var(--muted);
}
.empty-state svg {
  width: 44px;
  height: 44px;
  color: var(--gold-dim);
  margin-bottom: 14px;
}

/* ---------- footer ---------- */
.site-footer {
  text-align: center;
  padding: 22px 18px 34px;
  color: var(--muted);
  font-size: 12px;
  border-top: 1px solid var(--line);
}
.site-footer a {
  color: var(--gold-dim);
  text-decoration: none;
  font-weight: 700;
}

/* ---------- MODAL (item detail) ---------- */
.overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}
@media (min-width: 640px) {
  .overlay {
    align-items: center;
  }
}
.sheet {
  background: var(--panel);
  border: 1px solid var(--line);
  width: 100%;
  max-width: 480px;
  border-radius: 20px 20px 0 0;
  max-height: 88vh;
  overflow: auto;
  position: relative;
}
@media (min-width: 640px) {
  .sheet {
    border-radius: 20px;
  }
}
.sheet-photo {
  width: 100%;
  aspect-ratio: 16 / 10;
  background: var(--panel-2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.sheet-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sheet-photo svg {
  width: 50px;
  height: 50px;
  color: var(--gold-dim);
}
.sheet-body {
  padding: 22px 22px 28px;
}
.sheet-tag {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gold);
  font-weight: 800;
}
.sheet-name {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 24px;
  margin: 6px 0 4px;
}
.sheet-weight {
  color: var(--muted);
  font-size: 13px;
  margin-bottom: 14px;
}
.sheet-price {
  font-size: 22px;
  font-weight: 800;
  color: var(--gold-light);
}
.close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.close-btn svg {
  width: 16px;
  height: 16px;
  color: #fff;
}

/* ---------- PRELOADER ---------- */
.preloader {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at 50% 0%, rgba(164, 25, 44, 0.14), transparent 55%),
    radial-gradient(ellipse at 50% 100%, rgba(201, 162, 74, 0.08), transparent 55%), var(--bg);
}
.preloader-spinner {
  position: relative;
  width: 84px;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
}
.preloader-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--line);
  border-top-color: var(--gold);
  animation: preloader-spin 1.1s linear infinite;
}
.preloader-tray {
  width: 34px;
  height: 34px;
  color: var(--gold);
}
@keyframes preloader-spin {
  to {
    transform: rotate(360deg);
  }
}
.preloader-brand {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-weight: 700;
  font-size: 30px;
  background: linear-gradient(180deg, var(--red-light), var(--red) 70%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.preloader-sub {
  font-size: 11px;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: var(--gold);
  margin-top: 6px;
  font-weight: 700;
}

/* ---------- WELCOME: 3 entry sections ---------- */
.welcome-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 360px;
  margin-top: 6px;
}
.welcome-section-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--cream);
  padding: 17px 20px;
  border-radius: 14px;
  cursor: pointer;
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 16.5px;
  text-align: left;
  transition: transform 0.18s ease, border-color 0.18s ease;
}
.welcome-section-btn:hover {
  transform: translateY(-2px);
  border-color: var(--gold-dim);
}
.welcome-section-btn .arrow {
  color: var(--gold);
  font-size: 18px;
  flex: none;
}
.welcome-section-btn .num {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
  color: #1b1409;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  flex: none;
}
.welcome-section-btn .label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ---------- group titles inside the menu ---------- */
.group-title {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-weight: 700;
  font-size: 27px;
  color: var(--red-light);
  margin: 40px 2px 4px;
  scroll-margin-top: 150px;
}
.group-title:first-child {
  margin-top: 6px;
}
.group-title .bar {
  display: block;
  width: 46px;
  height: 3px;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--gold), transparent);
  margin-top: 8px;
}

/* ---------- ADMIN ---------- */

.admin-shell {
  max-width: 960px;
  margin: 0 auto;
  padding: 30px 18px 90px;
  width: 100%;
  flex: 1;
}
.admin-login {
  max-width: 380px;
  margin: 80px auto;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 32px 26px;
}
.admin-login h2 {
  font-family: 'Playfair Display', serif;
  margin: 0 0 6px;
  color: var(--gold-light);
}
.admin-login p {
  color: var(--muted);
  font-size: 13px;
  margin: 0 0 22px;
}
.field {
  margin-bottom: 14px;
}
.field label {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 6px;
  font-weight: 700;
  letter-spacing: 0.03em;
}
.field input,
.field select,
.field textarea {
  width: 100%;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  color: var(--cream);
  padding: 11px 13px;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
}
.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: var(--gold-dim);
}
.field-error {
  color: var(--red-light);
  font-size: 12.5px;
  margin-top: 8px;
}
.field-success {
  color: var(--gold-light);
  font-size: 12.5px;
  margin-top: 8px;
}
.btn-primary {
  width: 100%;
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
  color: #1b1409;
  border: none;
  padding: 13px;
  border-radius: 10px;
  font-weight: 800;
  cursor: pointer;
  font-size: 14.5px;
}
.btn-secondary {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--cream);
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  font-size: 13.5px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.btn-danger {
  background: rgba(164, 25, 44, 0.15);
  border: 1px solid var(--red);
  color: var(--red-light);
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  font-size: 12.5px;
}
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  gap: 10px;
  flex-wrap: wrap;
}
.admin-header h1 {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  color: var(--gold-light);
  margin: 0;
}
.admin-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 22px;
  border-bottom: 1px solid var(--line);
}
.admin-tab {
  background: transparent;
  border: none;
  color: var(--muted);
  padding: 10px 4px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-right: 18px;
}
.admin-tab.active {
  color: var(--gold-light);
  border-bottom-color: var(--gold);
}
.admin-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}
@media (min-width: 820px) {
  .admin-grid {
    grid-template-columns: 340px 1fr;
  }
}
.panel-box {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 20px;
}
.panel-box h3 {
  margin: 0 0 14px;
  font-family: 'Playfair Display', serif;
  color: var(--gold-light);
  font-size: 17px;
}
.photo-upload {
  border: 1.5px dashed var(--line);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  color: var(--muted);
  font-size: 12.5px;
}
.photo-upload img {
  max-width: 100%;
  max-height: 120px;
  border-radius: 8px;
  display: block;
  margin: 0 auto 8px;
}
.admin-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.admin-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px;
}
.admin-item .thumb {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: var(--panel-2);
  flex: none;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.admin-item .thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.admin-item .thumb svg {
  width: 20px;
  height: 20px;
  color: var(--gold-dim);
}
.admin-item .info {
  flex: 1;
  min-width: 0;
}
.admin-item .info .n {
  font-weight: 700;
  font-size: 13.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.admin-item .info .m {
  font-size: 11.5px;
  color: var(--muted);
  display: flex;
  gap: 8px;
  margin-top: 2px;
}
.admin-item .acts {
  display: flex;
  gap: 6px;
  flex: none;
}
.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--muted);
}
.icon-btn:hover {
  color: var(--gold-light);
  border-color: var(--gold-dim);
}
.icon-btn svg {
  width: 14px;
  height: 14px;
}
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--gold);
  color: #1b1409;
  padding: 11px 20px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 13.5px;
  z-index: 200;
  box-shadow: var(--shadow);
  opacity: 0;
  pointer-events: none;
  transition: 0.25s;
}
.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(-6px);
}
.admin-search {
  margin-bottom: 12px;
}
.datalist-hint {
  font-size: 11px;
  color: var(--muted);
  margin-top: 6px;
}
.loading-row {
  text-align: center;
  padding: 40px;
  color: var(--muted);
}
.user-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.user-row .uname {
  font-weight: 700;
  font-size: 13.5px;
}
.user-row .you {
  color: var(--gold-dim);
  font-size: 11px;
  margin-left: 6px;
  font-weight: 600;
}
.hr-space {
  height: 1px;
  background: var(--line);
  margin: 20px 0;
}

VOLIDAM_EOF_MARKER

mkdir -p "src/types"
cat > "src/types/index.ts" << 'VOLIDAM_EOF_MARKER'
export type Lang = 'ru' | 'uz' | 'en';
export type ThemeMode = 'light' | 'dark';

export interface MenuItem {
  id: string;
  name: string;
  weight?: string;
  price: number;
  tag: string;
  photo?: string | null;
}

export interface Category {
  tag: string;
  ru: string;
  uz: string;
  en: string;
}

export type AdminRole = 'super' | 'admin';

export interface AdminUser {
  username: string;
  passwordHash: string;
  salt: string;
  role: AdminRole;
  createdAt: number;
}

VOLIDAM_EOF_MARKER

echo "Done. Files updated:"
echo "  - index.html"
echo "  - src/App.tsx"
echo "  - src/components/Preloader.tsx"
echo "  - src/components/Welcome.tsx"
echo "  - src/context/AuthContext.tsx"
echo "  - src/context/ThemeContext.tsx"
echo "  - src/data/categories.ts"
echo "  - src/i18n/strings.ts"
echo "  - src/pages/AdminPanel.tsx"
echo "  - src/pages/MenuPage.tsx"
echo "  - src/styles/global.css"
echo "  - src/types/index.ts"
echo ""
echo "Now run:  npm run dev"