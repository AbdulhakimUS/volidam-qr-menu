import type { MenuItem } from '../types';
import { useLang } from '../context/LangContext';
import { useMenu } from '../context/MenuContext';
import { fmtPrice } from '../utils';
import { DishIcon } from './Icons';

export default function ItemCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  const { lang } = useLang();
  const { categories } = useMenu();
  const cat = categories.find((c) => c.tag === item.tag);
  const catLabel = cat ? cat[lang] : item.tag;

  return (
    <div className="card" onClick={onClick}>
      <div className="card-photo">{item.photo ? <img src={item.photo} alt={item.name} /> : <DishIcon />}</div>
      <div className="card-body">
        <div className="card-name">{item.name}</div>
        {item.weight ? <div className="card-weight">{item.weight}</div> : null}
        <div className="card-bottom">
          <div className="card-price">{fmtPrice(item.price, lang)}</div>
          <div className="card-tag">{catLabel}</div>
        </div>
      </div>
    </div>
  );
}

