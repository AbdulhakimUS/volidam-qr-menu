import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';
import { useMenu } from '../context/MenuContext';
import type { Lang, MenuItem } from '../types';
import { TrayIcon, SearchIcon, EmptyIcon, SunIcon, MoonIcon } from '../components/Icons';
import ItemCard from '../components/ItemCard';
import ItemModal from '../components/ItemModal';
import { tName } from '../utils';

interface NavState {
  sectionId?: number;
}

export default function MenuPage() {
  const { lang, setLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { items, categories, sections, error } = useMenu();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const sectionRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const groupRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const langs: Lang[] = ['ru', 'uz', 'en'];

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((i) => tName(i.title, lang).toLowerCase().includes(q));
  }, [items, query, lang]);

  const grouped = useMemo(() => {
    const g = new Map<number, MenuItem[]>();
    filtered.forEach((it) => {
      if (!g.has(it.category_id)) g.set(it.category_id, []);
      g.get(it.category_id)!.push(it);
    });
    return g;
  }, [filtered]);

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
    [sections],
  );

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order || a.id - b.id),
    [categories],
  );

  const activeCats = sortedCategories.filter((c) => (grouped.get(c.id)?.length ?? 0) > 0);
  const knownSectionIds = useMemo(() => new Set(sortedSections.map((s) => s.id)), [sortedSections]);
  const orphanCats = activeCats.filter((c) => !knownSectionIds.has(c.sectionId));

  useEffect(() => {
    const state = location.state as NavState | null;
    const sectionId = state?.sectionId;
    if (sectionId == null) return;
    const raf = requestAnimationFrame(() => {
      const el = groupRefs.current.get(sectionId);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 132;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [location.key, items.length, sections.length]);

  const scrollToCategory = (id: number | 'all') => {
    if (id === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = sectionRefs.current.get(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 132;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const renderCatBlock = (c: (typeof activeCats)[number]) => (
    <div
      key={c.id}
      ref={(el) => {
        if (el) sectionRefs.current.set(c.id, el);
      }}
    >
      <div className="section-title">{tName(c.name, lang)}</div>
      <div className="grid">
        {grouped.get(c.id)!.map((it) => (
          <ItemCard key={it.id} item={it} onClick={() => setActiveItem(it)} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-mini">
            <TrayIcon className="tray" />
            <span className="word">Volidam</span>
          </div>
          <div className="top-actions">
            <div className="lang-switch">
              {langs.map((l) => (
                <button key={l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="toggle theme">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
        <div className="search-row">
          <div className="search-box">
            <SearchIcon />
            <input placeholder={t('search')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
        <div className="cat-row">
          <button className="chip" onClick={() => scrollToCategory('all')}>
            {t('all')}
          </button>
          {activeCats.map((c) => (
            <button key={c.id} className="chip" onClick={() => scrollToCategory(c.id)}>
              {tName(c.name, lang)}
            </button>
          ))}
        </div>
      </header>

      <div className="menu-wrap">
        {error && (
          <div className="empty-state" style={{ marginBottom: 16 }}>
            <div>{error}</div>
          </div>
        )}
        {filtered.length === 0 && !error ? (
          <div className="empty-state">
            <EmptyIcon />
            <div>{t('empty')}</div>
          </div>
        ) : sortedSections.length === 0 && activeCats.length === 0 ? (
          <div className="grid">
            {filtered.map((it) => (
              <ItemCard key={it.id} item={it} onClick={() => setActiveItem(it)} />
            ))}
          </div>
        ) : (
          <>
            {sortedSections.map((section) => {
              const catsInSection = activeCats.filter((c) => c.sectionId === section.id);
              if (catsInSection.length === 0) return null;
              return (
                <div
                  key={section.id}
                  ref={(el) => {
                    if (el) groupRefs.current.set(section.id, el);
                  }}
                >
                  <div className="group-title">
                    {tName(section.name, lang)}
                    <span className="bar" />
                  </div>
                  {catsInSection.map(renderCatBlock)}
                </div>
              );
            })}
            {orphanCats.length > 0 && <div key="orphan">{orphanCats.map(renderCatBlock)}</div>}
          </>
        )}
      </div>

      <div className="site-footer">
        Volidam · Algoritm &nbsp;·&nbsp; <Link to="/admin">{t('admin')}</Link>
      </div>

      {activeItem && <ItemModal item={activeItem} onClose={() => setActiveItem(null)} />}
    </div>
  );
}
