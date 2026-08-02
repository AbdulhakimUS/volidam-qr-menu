import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { TrayIcon } from './Icons';
import { CATEGORY_GROUPS } from '../data/categories';
import type { Lang } from '../types';

export default function Welcome() {
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const langs: Lang[] = ['ru', 'uz', 'en'];

  const goToGroup = (groupKey: string) => {
    navigate('/menu', { state: { group: groupKey } });
  };

  return (
    <div className="welcome">
      <div className="lattice-strip" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
      <div className="brand-mark">
        <TrayIcon className="tray" />
        <div className="brand-name">Volidam</div>
        <div className="brand-sub">Algoritm</div>
      </div>
      <h1 className="welcome-greet">{t('welcomeTitle')}</h1>
      <p className="welcome-sub" dangerouslySetInnerHTML={{ __html: t('welcomeSub') }} />

      <div className="welcome-sections">
        {CATEGORY_GROUPS.map((g, idx) => (
          <button key={g.key} className="welcome-section-btn" onClick={() => goToGroup(g.key)}>
            <span className="label">
              <span className="num">{idx + 1}</span>
              <span>{g[lang]}</span>
            </span>
            <span className="arrow">→</span>
          </button>
        ))}
      </div>

      <div className="welcome-langs">
        {langs.map((l) => (
          <button key={l} className={`lang-pill ${lang === l ? 'active' : ''}`} onClick={() => setLang(l)}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="lattice-strip" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
    </div>
  );
}

