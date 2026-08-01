import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';
import { useMenu } from '../context/MenuContext';
import type { Lang, MenuItem } from '../types';
import { TrayIcon, SearchIcon, EmptyIcon, SunIcon, MoonIcon } from '../components/Icons';
import ItemCard from '../components/ItemCard';
import ItemModal from '../components/ItemModal';

export default function MenuPage() {
  const { lang, setLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { items, categories } = useMenu();
  const [query, setQuery] = useState('');
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const langs: Lang[] = ['ru', 'uz', 'en'];

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, query]);

  const grouped = useMemo(() => {
    const g = new Map<string, MenuItem[]>();
    filtered.forEach((it) => {
      if (!g.has(it.tag)) g.set(it.tag, []);
      g.get(it.tag)!.push(it);
    });
    return g;
  }, [filtered]);

  const activeCats = categories.filter((c) => items.some((i) => i.tag === c.tag));

  const scrollToCategory = (tag: string) => {
    if (tag === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = sectionRefs.current.get(tag);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 132;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

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
          <button className="chip active-none chip" onClick={() => scrollToCategory('all')}>
            {t('all')}
          </button>
          {activeCats.map((c) => (
            <button key={c.tag} className="chip" onClick={() => scrollToCategory(c.tag)}>
              {c[lang]}
            </button>
          ))}
        </div>
      </header>

      <div className="menu-wrap">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <EmptyIcon />
            <div>{t('empty')}</div>
          </div>
        ) : (
          activeCats
            .filter((c) => grouped.get(c.tag)?.length)
            .map((c) => (
              <div
                key={c.tag}
                ref={(el) => {
                  if (el) sectionRefs.current.set(c.tag, el);
                }}
              >
                <div className="section-title">{c[lang]}</div>
                <div className="grid">
                  {grouped.get(c.tag)!.map((it) => (
                    <ItemCard key={it.id} item={it} onClick={() => setActiveItem(it)} />
                  ))}
                </div>
              </div>
            ))
        )}
      </div>

      <div className="site-footer">
        Volidam · Algoritm &nbsp;·&nbsp; <Link to="/admin">{t('admin')}</Link>
      </div>

      {activeItem && <ItemModal item={activeItem} onClose={() => setActiveItem(null)} />}
    </div>
  );
}

