import type { MenuItem } from '../types';
import { useLang } from '../context/LangContext';
import { useMenu } from '../context/MenuContext';
import { fmtPrice } from '../utils';
import { CloseIcon, DishIcon } from './Icons';

export default function ItemModal({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const { lang, t } = useLang();
  const { categories } = useMenu();
  const cat = categories.find((c) => c.tag === item.tag);
  const catLabel = cat ? cat[lang] : item.tag;

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
        <div className="sheet-photo">{item.photo ? <img src={item.photo} alt={item.name} /> : <DishIcon />}</div>
        <div className="sheet-body">
          <div className="sheet-tag">{catLabel}</div>
          <div className="sheet-name">{item.name}</div>
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

