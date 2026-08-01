import React, { createContext, useContext, useState } from 'react';
import type { Lang } from '../types';
import { STR } from '../i18n/strings';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<LangCtx | null>(null);
const STORAGE_KEY = 'volidam-lang';

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ru' || saved === 'uz' || saved === 'en') return saved;
    return 'ru';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: string) => STR[lang][key] || key;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}

