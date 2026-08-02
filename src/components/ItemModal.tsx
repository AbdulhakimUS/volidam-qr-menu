import type { MenuItem } from '../types';
import { useLang } from '../context/LangContext';
import { useMenu } from '../context/MenuContext';
import { fmtPrice, tName } from '../utils';
import { CloseIcon, DishIcon } from './Icons';

export default function ItemModal({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const { lang, t } = useLang();
  const { categories } = useMenu();
  const cat = categories.find((c) => c.id === item.category_id);
  const catLabel = cat ? tName(cat.name, lang) : '';
  const name = tName(item.title, lang);

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet">
        <button className="close-btn" onClick={onClose} aria-label="close">
          <CloseIcon />
        </button>
        <div className="sheet-photo">{item.photo ? <img src={item.photo} alt={name} /> : <DishIcon />}</div>
        <div className="sheet-body">
          {catLabel ? <div className="sheet-tag">{catLabel}</div> : null}
          <div className="sheet-name">{name}</div>
          {item.weight ? (
            <div className="sheet-weight">
              {t('weight')}: {item.weight}
            </div>
          ) : null}
          <div className="sheet-price">{fmtPrice(item.price, lang)}</div>
        </div>
      </div>
    </div>
  );
}
