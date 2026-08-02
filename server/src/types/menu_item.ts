export interface Translation {
  uz: string;
  ru: string;
  en: string;
}

export interface MenuItem {
  id: number;
  category_id: number;
  title: Translation;
  photo: string;
  weight?: string;
  price: number;
}

export interface CreateMenuItemDTO {
  category_id: number;
  title: Translation;
  photo?: string;
  weight?: string;
  price: number;
}

export interface UpdateMenuItemDTO {
  category_id?: number;
  title?: Translation;
  photo?: string;
  weight?: string;
  price?: number;
}
