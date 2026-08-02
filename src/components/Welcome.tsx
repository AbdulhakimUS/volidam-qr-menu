import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useMenu } from '../context/MenuContext';
import { TrayIcon } from './Icons';
import type { Lang } from '../types';
import { tName } from '../utils';

export default function Welcome() {
  const { lang, setLang, t } = useLang();
  const { sections } = useMenu();
  const navigate = useNavigate();
  const langs: Lang[] = ['ru', 'uz', 'en'];

  const goToGroup = (sectionId: number) => {
    navigate('/menu', { state: { sectionId } });
  };

  const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

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
        {sorted.length === 0 ? (
          <button className="welcome-section-btn" onClick={() => navigate('/menu')}>
            <span className="label">
              <span className="num">1</span>
              <span>{t('enter')}</span>
            </span>
            <span className="arrow">→</span>
          </button>
        ) : (
          sorted.map((s, idx) => (
            <button key={s.id} className="welcome-section-btn" onClick={() => goToGroup(s.id)}>
              <span className="label">
                <span className="num">{idx + 1}</span>
                <span>{tName(s.name, lang)}</span>
              </span>
              <span className="arrow">→</span>
            </button>
          ))
        )}
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
