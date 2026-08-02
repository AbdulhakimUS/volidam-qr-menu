export type Lang = 'ru' | 'uz' | 'en';
export type ThemeMode = 'light' | 'dark';

export interface Translation {
  uz: string;
  ru: string;
  en: string;
}

export interface Section {
  id: number;
  name: Translation;
  sort_order: number;
}

export interface Category {
  id: number;
  name: Translation;
  order: number;
  sectionId: number;
}

export interface MenuItem {
  id: number;
  category_id: number;
  title: Translation;
  photo: string | null;
  weight?: string;
  price: number;
}

export type AdminRole = 'super' | 'admin';

export interface AdminUser {
  id: number;
  username: string;
  admin_status: AdminRole;
}

export interface ApiErrorBody {
  success: false;
  error: string;
}
