export interface Translation {
  uz: string;
  ru: string;
  en: string;
}

export interface Category {
  id: number;
  name: Translation;
  order: number;
  sectionId: number;
}

export interface CreateCategoryDTO {
  name: Translation;
  order: number;
  sectionId: number;
}

export interface UpdateCategoryDTO {
  name?: Translation;
  order?: number;
  sectionId?: number;
}
