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


