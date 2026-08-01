import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Category, MenuItem } from '../types';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { SEED_ITEMS } from '../data/seedItems';
import { uid } from '../utils';

const ITEMS_KEY = 'volidam-menu-items';

interface MenuCtx {
  items: MenuItem[];
  categories: Category[];
  addItem: (item: Omit<MenuItem, 'id'>) => void;
  updateItem: (id: string, item: Omit<MenuItem, 'id'>) => void;
  deleteItem: (id: string) => void;
}

const Ctx = createContext<MenuCtx | null>(null);

function loadInitialItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt storage */
  }
  const seeded = SEED_ITEMS.map((it) => ({ ...it, id: uid(), photo: null }));
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(seeded));
  } catch {
    /* storage might be full — app still works in-memory */
  }
  return seeded;
}

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<MenuItem[]>(loadInitialItems);

  useEffect(() => {
    try {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    } catch {
      /* storage might be full (e.g. too many large photos) */
    }
  }, [items]);

  const categories = useMemo<Category[]>(() => {
    const known = new Set(DEFAULT_CATEGORIES.map((c) => c.tag));
    const extra: Category[] = [];
    items.forEach((it) => {
      if (it.tag && !known.has(it.tag) && !extra.find((c) => c.tag === it.tag)) {
        const label = it.tag.charAt(0).toUpperCase() + it.tag.slice(1);
        extra.push({ tag: it.tag, ru: label, uz: label, en: label });
        known.add(it.tag);
      }
    });
    return DEFAULT_CATEGORIES.concat(extra);
  }, [items]);

  const addItem: MenuCtx['addItem'] = (item) => {
    setItems((prev) => [...prev, { ...item, id: uid() }]);
  };
  const updateItem: MenuCtx['updateItem'] = (id, item) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...item, id } : it)));
  };
  const deleteItem: MenuCtx['deleteItem'] = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  return (
    <Ctx.Provider value={{ items, categories, addItem, updateItem, deleteItem }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMenu must be used within MenuProvider');
  return ctx;
}

