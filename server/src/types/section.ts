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

export interface CreateSectionDTO {
  name: Translation;
  sort_order: number;
}

export interface UpdateSectionDTO {
  name?: Translation;
  sort_order?: number;
}