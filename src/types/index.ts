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

