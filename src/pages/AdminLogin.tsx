import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { t } = useLang();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (!ok) setError(true);
  };

  return (
    <div className="admin-shell">
      <div className="admin-login">
        <h2>{t('adminLogin')}</h2>
        <p>{t('adminLoginSub')}</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{t('login')}</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div className="field">
            <label>{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <div className="field-error">{t('wrongCreds')}</div>}
          <button className="btn-primary" type="submit" style={{ marginTop: 6 }}>
            {t('enterBtn')}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <Link to="/menu" style={{ color: 'var(--muted)', fontSize: 13 }}>
            {t('backToMenu')}
          </Link>
        </div>
      </div>
    </div>
  );
}

