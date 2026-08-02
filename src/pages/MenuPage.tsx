import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';
import { useMenu } from '../context/MenuContext';
import { CATEGORY_GROUPS, groupForTag } from '../data/categories';
import type { Lang, MenuItem } from '../types';
import { TrayIcon, SearchIcon, EmptyIcon, SunIcon, MoonIcon } from '../components/Icons';
import ItemCard from '../components/ItemCard';
import ItemModal from '../components/ItemModal';

interface NavState {
  group?: string;
}

export default function MenuPage() {
  const { lang, setLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { items, categories } = useMenu();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const groupRefs = useRef<Map<string, HTMLDivElement>>(new Map());
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

  // Scroll to the group requested from the Welcome screen, once sections exist.
  useEffect(() => {
    const state = location.state as NavState | null;
    const groupKey = state?.group;
    if (!groupKey) return;
    const raf = requestAnimationFrame(() => {
      const el = groupRefs.current.get(groupKey);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 132;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, items.length]);

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
          <button className="chip" onClick={() => scrollToCategory('all')}>
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
          CATEGORY_GROUPS.map((group) => {
            const catsInGroup = activeCats.filter((c) => groupForTag(c.tag).key === group.key && grouped.get(c.tag)?.length);
            if (catsInGroup.length === 0) return null;
            return (
              <div
                key={group.key}
                ref={(el) => {
                  if (el) groupRefs.current.set(group.key, el);
                }}
              >
                <div className="group-title">
                  {group[lang]}
                  <span className="bar" />
                </div>
                {catsInGroup.map((c) => (
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
                ))}
              </div>
            );
          })
        )}
      </div>

      <div className="site-footer">
        Volidam · Algoritm &nbsp;·&nbsp; <Link to="/admin">{t('admin')}</Link>
      </div>

      {activeItem && <ItemModal item={activeItem} onClose={() => setActiveItem(null)} />}
    </div>
  );
}

