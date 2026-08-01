import type { Lang } from './types';

export function uid(): string {
  return 'id_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function fmtPrice(price: number, lang: Lang): string {
  const n = Number(price) || 0;
  const s = n.toLocaleString('ru-RU').replace(/,/g, ' ');
  const suf = lang === 'uz' ? "so'm" : lang === 'en' ? 'UZS' : 'сум';
  return `${s} ${suf}`;
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function randomSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return bufToHex(arr.buffer);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(salt + ':' + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bufToHex(digest);
}

export function slugifyTag(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^#/, '')
    .replace(/\s+/g, '');
}

