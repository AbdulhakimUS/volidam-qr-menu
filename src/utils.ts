import type { Lang, Translation } from './types';

export function fmtPrice(price: number, lang: Lang): string {
  const n = Number(price) || 0;
  const s = n.toLocaleString('ru-RU').replace(/,/g, ' ');
  const suf = lang === 'uz' ? "so'm" : lang === 'en' ? 'UZS' : 'сум';
  return `${s} ${suf}`;
}

export function tName(tr: Translation | null | undefined, lang: Lang): string {
  if (!tr) return '';
  return (tr[lang] || tr.ru || tr.uz || tr.en || '').trim();
}

export function makeTranslation(value: string): Translation {
  const v = value.trim();
  return { uz: v, ru: v, en: v };
}
