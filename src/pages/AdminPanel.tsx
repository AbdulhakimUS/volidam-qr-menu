import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { useMenu } from '../context/MenuContext';
import type { MenuItem } from '../types';
import { fmtPrice, slugifyTag } from '../utils';
import { DishIcon, EditIcon, TrashIcon } from '../components/Icons';

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const show = (m: string) => {
    setMsg(m);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 1800);
  };
  return { msg, show };
}

export default function AdminPanel() {
  const { t } = useLang();
  const { currentUser, logout } = useAuth();
  const [tab, setTab] = useState<'menu' | 'users'>('menu');
  const { msg, show } = useToast();

  if (!currentUser) {
    // Should not normally happen (route guard redirects), but keep as a safe fallback.
    return null;
  }

  return (
    <div className="admin-shell">
      <div className="admin-header">
        <h1>{t('menuManage')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/menu" className="btn-secondary">
            {t('backToMenu')}
          </Link>
          <button className="btn-secondary" onClick={logout}>
            {t('logout')}
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'menu' ? 'active' : ''}`} onClick={() => setTab('menu')}>
          {t('tabMenu')}
        </button>
        <button className={`admin-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          {t('tabUsers')}
        </button>
      </div>

      {tab === 'menu' ? <MenuTab onToast={show} /> : <UsersTab onToast={show} />}

      <div className={`toast ${msg ? 'show' : ''}`}>{msg}</div>
    </div>
  );
}

/* ============================= MENU TAB ============================= */

function emptyForm() {
  return { id: '', name: '', price: '', weight: '', tag: '', photo: null as string | null };
}

function MenuTab({ onToast }: { onToast: (m: string) => void }) {
  const { t, lang } = useLang();
  const { items, categories, addItem, updateItem, deleteItem } = useMenu();
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const editing = !!form.id;

  const startEdit = (it: MenuItem) => {
    setForm({ id: it.id, name: it.name, price: String(it.price), weight: it.weight || '', tag: it.tag, photo: it.photo || null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const resetForm = () => setForm(emptyForm());

  const handlePhotoFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 900;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setForm((f) => ({ ...f, photo: dataUrl }));
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const price = Number(form.price);
    const tag = slugifyTag(form.tag);
    if (!name || !price || !tag) {
      setError(true);
      return;
    }
    setError(false);
    const payload = { name, price, weight: form.weight.trim(), tag, photo: form.photo };
    if (editing) updateItem(form.id, payload);
    else addItem(payload);
    onToast(t('saved'));
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    deleteItem(id);
    onToast(t('deleted'));
  };

  const list = items
    .filter((it) => !search.trim() || it.name.toLowerCase().includes(search.trim().toLowerCase()))
    .slice()
    .sort((a, b) => a.tag.localeCompare(b.tag) || a.name.localeCompare(b.name));

  const catLabel = (tag: string) => {
    const c = categories.find((c) => c.tag === tag);
    return c ? c[lang as keyof typeof c] : tag;
  };

  return (
    <div className="admin-grid">
      <div className="panel-box">
        <h3>{editing ? t('editItem') : t('addItem')}</h3>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{t('name')} *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('name')} />
          </div>
          <div className="field">
            <label>{t('price')} *</label>
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="45000"
            />
          </div>
          <div className="field">
            <label>{t('weightOpt')}</label>
            <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="250 гр" />
          </div>
          <div className="field">
            <label>{t('hashtag')} *</label>
            <input
              list="tagList"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              placeholder="salatlar"
            />
            <datalist id="tagList">
              {categories.map((c) => (
                <option key={c.tag} value={c.tag} />
              ))}
            </datalist>
            <div className="datalist-hint">{t('hashtagHint')}</div>
          </div>
          <div className="field">
            <label>{t('photo')}</label>
            <div
              className="photo-upload"
              onClick={() => fileInput.current?.click()}
            >
              {form.photo && <img src={form.photo} alt="" />}
              <div>{t('uploadPhoto')}</div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoFile(file);
                }}
              />
            </div>
            <input
              style={{ marginTop: 8 }}
              placeholder={t('photoUrl')}
              value={form.photo && form.photo.startsWith('http') ? form.photo : ''}
              onChange={(e) => setForm({ ...form, photo: e.target.value || null })}
            />
          </div>
          {error && <div className="field-error">{t('fillRequired')}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button type="submit" className="btn-primary">
              {t('save')}
            </button>
            {editing && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                {t('cancel')}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="panel-box">
        <h3>
          {t('allItems')} — {items.length} {t('itemsCount')}
        </h3>
        <div className="field admin-search">
          <input placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="admin-list">
          {list.map((it) => (
            <div className="admin-item" key={it.id}>
              <div className="thumb">{it.photo ? <img src={it.photo} alt="" /> : <DishIcon />}</div>
              <div className="info">
                <div className="n">{it.name}</div>
                <div className="m">
                  <span>{fmtPrice(it.price, lang)}</span>
                  <span>·</span>
                  <span>{catLabel(it.tag)}</span>
                </div>
              </div>
              <div className="acts">
                <button className="icon-btn" title={t('edit')} onClick={() => startEdit(it)}>
                  <EditIcon />
                </button>
                <button className="icon-btn" title={t('delete')} onClick={() => handleDelete(it.id)}>
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================= USERS TAB ============================= */

function UsersTab({ onToast }: { onToast: (m: string) => void }) {
  const { t } = useLang();
  const { currentUser, users, createUser, changeOwnPassword, changeOwnUsername, deleteUser } = useAuth();

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [curPass, setCurPass] = useState('');
  const [nextPass, setNextPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);

  const [nextUsername, setNextUsername] = useState('');
  const [unameError, setUnameError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createUser(newUsername, newPassword);
    if (!res.ok) {
      setCreateError(t(res.error || 'fillAllFields'));
      return;
    }
    setCreateError(null);
    setNewUsername('');
    setNewPassword('');
    onToast(t('userCreated'));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await changeOwnPassword(curPass, nextPass);
    if (!res.ok) {
      setPassError(t(res.error || 'wrongCurrentPassword'));
      return;
    }
    setPassError(null);
    setCurPass('');
    setNextPass('');
    onToast(t('passwordChanged'));
  };

  const handleChangeUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const res = changeOwnUsername(nextUsername);
    if (!res.ok) {
      setUnameError(t(res.error || 'fillAllFields'));
      return;
    }
    setUnameError(null);
    setNextUsername('');
    onToast(t('usernameChanged'));
  };

  const handleDelete = (username: string) => {
    if (!confirm(`${t('delete')} "${username}"?`)) return;
    const res = deleteUser(username);
    if (!res.ok) {
      onToast(t(res.error || 'cannotDeleteSelf'));
      return;
    }
    onToast(t('userDeleted'));
  };

  return (
    <div className="admin-grid">
      <div className="panel-box">
        <h3>{t('addUser')}</h3>
        <form onSubmit={handleCreate}>
          <div className="field">
            <label>{t('newUsername')}</label>
            <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('newPassword')}</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          {createError && <div className="field-error">{createError}</div>}
          <button type="submit" className="btn-primary">
            {t('createUser')}
          </button>
        </form>

        <div className="hr-space" />

        <h3>{t('changeUsername')}</h3>
        <form onSubmit={handleChangeUsername}>
          <div className="field">
            <label>{t('newUsernameLabel')}</label>
            <input value={nextUsername} onChange={(e) => setNextUsername(e.target.value)} placeholder={currentUser || ''} />
          </div>
          {unameError && <div className="field-error">{unameError}</div>}
          <button type="submit" className="btn-primary">
            {t('apply')}
          </button>
        </form>

        <div className="hr-space" />

        <h3>{t('changePassword')}</h3>
        <form onSubmit={handleChangePassword}>
          <div className="field">
            <label>{t('currentPassword')}</label>
            <input type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('newPasswordLabel')}</label>
            <input type="password" value={nextPass} onChange={(e) => setNextPass(e.target.value)} />
          </div>
          {passError && <div className="field-error">{passError}</div>}
          <button type="submit" className="btn-primary">
            {t('apply')}
          </button>
        </form>
      </div>

      <div className="panel-box">
        <h3>
          {t('users')} — {users.length}
        </h3>
        {users.map((u) => (
          <div className="user-row" key={u.username}>
            <div>
              <span className="uname">{u.username}</span>
              {u.username === currentUser && <span className="you">({t('loggedInAs').split(' ').pop()})</span>}
            </div>
            {u.username !== currentUser && (
              <button className="btn-danger" onClick={() => handleDelete(u.username)}>
                {t('delete')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

