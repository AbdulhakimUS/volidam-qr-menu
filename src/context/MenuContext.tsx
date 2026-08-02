import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Category, MenuItem, Section, Translation } from '../types';
import * as api from '../api/client';
import { ApiError } from '../api/client';

interface MenuCtx {
  items: MenuItem[];
  categories: Category[];
  sections: Section[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (item: {
    category_id: number;
    title: Translation;
    photo?: string | null;
    weight?: string;
    price: number;
  }) => Promise<void>;
  updateItem: (
    id: number,
    item: Partial<{
      category_id: number;
      title: Translation;
      photo: string | null;
      weight: string;
      price: number;
    }>,
  ) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  addCategory: (payload: {
    name: Translation;
    order: number;
    sectionId: number;
  }) => Promise<Category>;
}

const Ctx = createContext<MenuCtx | null>(null);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [menuItems, cats, secs] = await Promise.all([
        api.fetchMenuItems(),
        api.fetchCategories(),
        api.fetchSections(),
      ]);
      setItems(menuItems);
      setCategories(cats);
      setSections(secs);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load menu';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem: MenuCtx['addItem'] = async (item) => {
    const created = await api.createMenuItem(item);
    setItems((prev) => [...prev, created]);
  };

  const updateItem: MenuCtx['updateItem'] = async (id, item) => {
    const updated = await api.updateMenuItem(id, item);
    setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
  };

  const deleteItem: MenuCtx['deleteItem'] = async (id) => {
    await api.deleteMenuItem(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const addCategory: MenuCtx['addCategory'] = async (payload) => {
    const created = await api.createCategory(payload);
    setCategories((prev) => [...prev, created].sort((a, b) => a.order - b.order));
    return created;
  };

  return (
    <Ctx.Provider
      value={{
        items,
        categories,
        sections,
        loading,
        error,
        refresh,
        addItem,
        updateItem,
        deleteItem,
        addCategory,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMenu must be used within MenuProvider');
  return ctx;
}
