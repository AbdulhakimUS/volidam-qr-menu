import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { useMenu } from '../context/MenuContext';
import type { MenuItem } from '../types';
import { fmtPrice, makeTranslation, tName } from '../utils';
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

  if (!currentUser) return null;

  return (
    <div className="admin-shell">
      <div className="admin-header">
        <h1>{t('menuManage')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/menu" className="btn-secondary">
            {t('backToMenu')}
          </Link>
          <button className="btn-secondary" onClick={() => void logout()}>
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

function emptyForm() {
  return {
    id: 0,
    name: '',
    price: '',
    weight: '',
    categoryId: '' as string | number,
    photo: null as string | null,
  };
}

function MenuTab({ onToast }: { onToast: (m: string) => void }) {
  const { t, lang } = useLang();
  const { items, categories, sections, addItem, updateItem, deleteItem } = useMenu();
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const editing = !!form.id;

  const startEdit = (it: MenuItem) => {
    setForm({
      id: it.id,
      name: tName(it.title, lang) || it.title.ru || it.title.uz || it.title.en,
      price: String(it.price),
      weight: it.weight || '',
      categoryId: it.category_id,
      photo: it.photo || null,
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const price = Number(form.price);
    const category_id = Number(form.categoryId);
    if (!name || !price || !category_id) {
      setError(true);
      return;
    }
    setError(false);
    setSaving(true);
    try {
      const payload = {
        title: makeTranslation(name),
        price,
        weight: form.weight.trim(),
        category_id,
        photo: form.photo,
      };
      if (editing) await updateItem(form.id, payload);
      else await addItem(payload);
      onToast(t('saved'));
      resetForm();
    } catch (err) {
      onToast(err instanceof Error ? err.message : t('fillRequired'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await deleteItem(id);
      onToast(t('deleted'));
    } catch (err) {
      onToast(err instanceof Error ? err.message : t('deleted'));
    }
  };

  const list = items
    .filter((it) => {
      if (!search.trim()) return true;
      return tName(it.title, lang).toLowerCase().includes(search.trim().toLowerCase());
    })
    .slice()
    .sort((a, b) => {
      const ca = categories.find((c) => c.id === a.category_id);
      const cb = categories.find((c) => c.id === b.category_id);
      const na = tName(a.title, lang);
      const nb = tName(b.title, lang);
      return (ca?.order ?? 0) - (cb?.order ?? 0) || na.localeCompare(nb);
    });

  const catLabel = (id: number) => {
    const c = categories.find((c) => c.id === id);
    return c ? tName(c.name, lang) : String(id);
  };

  const sortedCats = [...categories].sort((a, b) => a.order - b.order || a.id - b.id);

  return (
    <div className="admin-grid">
      <div className="panel-box">
        <h3>{editing ? t('editItem') : t('addItem')}</h3>
        <form onSubmit={(e) => void handleSubmit(e)}>
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
            <label>{t('category')} *</label>
            <select
              value={form.categoryId === '' ? '' : String(form.categoryId)}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : '' })}
            >
              <option value="">{t('selectCategory')}</option>
              {sortedCats.map((c) => {
                const section = sections.find((s) => s.id === c.sectionId);
                const prefix = section ? `${tName(section.name, lang)} · ` : '';
                return (
                  <option key={c.id} value={c.id}>
                    {prefix}
                    {tName(c.name, lang)}
                  </option>
                );
              })}
            </select>
            {sortedCats.length === 0 && <div className="datalist-hint">{t('noCategories')}</div>}
          </div>
          <div className="field">
            <label>{t('photo')}</label>
            <div className="photo-upload" onClick={() => fileInput.current?.click()}>
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
            <button type="submit" className="btn-primary" disabled={saving}>
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
                <div className="n">{tName(it.title, lang)}</div>
                <div className="m">
                  <span>{fmtPrice(it.price, lang)}</span>
                  <span>·</span>
                  <span>{catLabel(it.category_id)}</span>
                </div>
              </div>
              <div className="acts">
                <button className="icon-btn" title={t('edit')} onClick={() => startEdit(it)}>
                  <EditIcon />
                </button>
                <button className="icon-btn" title={t('delete')} onClick={() => void handleDelete(it.id)}>
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

function UsersTab({ onToast }: { onToast: (m: string) => void }) {
  const { t } = useLang();
  const {
    currentUser,
    isSuperAdmin,
    users,
    createUser,
    changeOwnPassword,
    changeOwnUsername,
    deleteUser,
    setUserRole,
  } = useAuth();

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

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await changeOwnUsername(nextUsername);
    if (!res.ok) {
      setUnameError(t(res.error || 'fillAllFields'));
      return;
    }
    setUnameError(null);
    setNextUsername('');
    onToast(t('usernameChanged'));
  };

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`${t('delete')} "${username}"?`)) return;
    const res = await deleteUser(id);
    if (!res.ok) {
      onToast(t(res.error || 'cannotDeleteSelf'));
      return;
    }
    onToast(t('userDeleted'));
  };

  const handleToggleRole = async (id: number, nextRole: 'super' | 'admin') => {
    const res = await setUserRole(id, nextRole);
    if (!res.ok) {
      onToast(t(res.error || 'notAuthorized'));
      return;
    }
    onToast(t('saved'));
  };

  return (
    <div className="admin-grid">
      <div className="panel-box">
        {!isSuperAdmin && (
          <>
            <div className="field-error" style={{ marginBottom: 16 }}>
              {t('onlySuperCanManage')}
            </div>
            <div className="hr-space" />
          </>
        )}

        {isSuperAdmin && (
          <>
            <h3>{t('addUser')}</h3>
            <form onSubmit={(e) => void handleCreate(e)}>
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
          </>
        )}

        <h3>{t('changeUsername')}</h3>
        <form onSubmit={(e) => void handleChangeUsername(e)}>
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
        <form onSubmit={(e) => void handleChangePassword(e)}>
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
        {users.map((u) => {
          const protectedUser = u.username.toLowerCase() === 'amonovvv';
          return (
            <div className="user-row" key={u.id}>
              <div>
                <span className="uname">{u.username}</span>
                {u.username === currentUser && <span className="you">({t('loggedInAs').split(' ').pop()})</span>}
                <span className="you" style={{ color: u.admin_status === 'super' ? 'var(--gold-light)' : 'var(--muted)' }}>
                  {' '}
                  · {u.admin_status === 'super' ? t('roleSuper') : t('roleAdmin')}
                  {protectedUser ? ' 🛡' : ''}
                </span>
              </div>
              {isSuperAdmin && u.username !== currentUser && !protectedUser && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: '8px 12px', fontSize: 12.5 }}
                    onClick={() => void handleToggleRole(u.id, u.admin_status === 'super' ? 'admin' : 'super')}
                  >
                    {u.admin_status === 'super' ? t('removeSuperAdmin') : t('makeSuperAdmin')}
                  </button>
                  <button className="btn-danger" onClick={() => void handleDelete(u.id, u.username)}>
                    {t('delete')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
