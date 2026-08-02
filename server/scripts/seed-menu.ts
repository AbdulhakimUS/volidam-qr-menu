/**
 * One-shot seed: restores the old local menu into Postgres.
 * Run: npx tsx scripts/seed-menu.ts  (from server/)
 */
import bcrypt from "bcryptjs";
import pool from "../src/config/postgresql.js";
import { serializeTranslation } from "../src/utils/translations.js";

const SECTIONS = [
  {
    id: 1,
    name: { uz: "Milliy taom", ru: "Миллий таом", en: "National dishes" },
    sort_order: 1,
  },
  {
    id: 2,
    name: { uz: "Yevropa taom", ru: "Европа таом", en: "European dishes" },
    sort_order: 2,
  },
  {
    id: 3,
    name: { uz: "Bar va desertlar", ru: "Бар и десерты", en: "Bar & desserts" },
    sort_order: 3,
  },
];

const CATEGORIES: Array<{
  tag: string;
  name: { uz: string; ru: string; en: string };
  section: 1 | 2 | 3;
  order: number;
}> = [
  { tag: "salatlar", name: { ru: "Салатлар", uz: "Salatlar", en: "Salads" }, section: 1, order: 1 },
  { tag: "non", name: { ru: "Нон ассорти", uz: "Non assorti", en: "Bread" }, section: 1, order: 2 },
  { tag: "sovuqgazak", name: { ru: "Холодные закуски", uz: "Sovuq gazaklar", en: "Cold appetizers" }, section: 1, order: 3 },
  { tag: "somsa", name: { ru: "Сомса", uz: "Somsa", en: "Somsa" }, section: 1, order: 4 },
  { tag: "souslar", name: { ru: "Соуслар", uz: "Souslar", en: "Sauces" }, section: 1, order: 5 },
  { tag: "uygur", name: { ru: "Уйгурские блюда", uz: "Uyg'ur taomlari", en: "Uyghur dishes" }, section: 1, order: 6 },
  { tag: "buyurtma", name: { ru: "Блюда на заказ", uz: "Buyurtma taomlar", en: "Order dishes" }, section: 1, order: 7 },
  { tag: "kabob", name: { ru: "Кабоблар", uz: "Kabob", en: "Kebabs" }, section: 1, order: 8 },
  { tag: "barbekyu", name: { ru: "Барбекю", uz: "Barbekyu", en: "BBQ" }, section: 1, order: 9 },
  { tag: "baliq", name: { ru: "Рыба", uz: "Baliq", en: "Fish" }, section: 1, order: 10 },
  { tag: "yevropa", name: { ru: "Европейские блюда", uz: "Yevropa taomlari", en: "European dishes" }, section: 2, order: 1 },
  { tag: "issiqichimlik", name: { ru: "Горячие напитки", uz: "Issiq ichimliklar", en: "Hot drinks" }, section: 3, order: 1 },
  { tag: "salqinichimlik", name: { ru: "Холодные напитки", uz: "Salqin ichimliklar", en: "Cold drinks" }, section: 3, order: 2 },
  { tag: "muzqaymoq", name: { ru: "Мороженое", uz: "Muzqaymoq", en: "Ice cream" }, section: 3, order: 3 },
];

type SeedItem = { name: string; weight?: string; price: number; tag: string };

const SEED_ITEMS: SeedItem[] = [
  { name: "Волидам", weight: "250 гр", price: 45000, tag: "salatlar" },
  { name: "Азизам", weight: "400 гр", price: 45000, tag: "salatlar" },
  { name: "Робия", weight: "250 гр", price: 45000, tag: "salatlar" },
  { name: "Хрустяшки", weight: "300 гр", price: 50000, tag: "salatlar" },
  { name: "Ананас", weight: "300 гр", price: 45000, tag: "salatlar" },
  { name: "Сате (Ассорти)", weight: "", price: 60000, tag: "salatlar" },
  { name: "Семург", weight: "250 гр", price: 40000, tag: "salatlar" },
  { name: "Салат Шафран", weight: "230 гр", price: 40000, tag: "salatlar" },
  { name: "Фруктовий салат", weight: "200 гр", price: 35000, tag: "salatlar" },
  { name: "Овошной букет", weight: "350 гр", price: 30000, tag: "salatlar" },
  { name: "Оливье", weight: "200 гр", price: 40000, tag: "salatlar" },
  { name: "Винегрет", weight: "200 гр", price: 30000, tag: "salatlar" },
  { name: "Чупон", weight: "250 гр", price: 45000, tag: "salatlar" },
  { name: "Мужской каприз", weight: "200 гр", price: 45000, tag: "salatlar" },
  { name: "Греческий", weight: "300 гр", price: 40000, tag: "salatlar" },
  { name: "Японский", weight: "200 гр", price: 40000, tag: "salatlar" },
  { name: "Французкий", weight: "200 гр", price: 40000, tag: "salatlar" },
  { name: "Цезар", weight: "330 гр", price: 45000, tag: "salatlar" },
  { name: "Ачик-чучук", weight: "250 гр", price: 20000, tag: "salatlar" },
  { name: "Чирокчи", weight: "350 гр", price: 25000, tag: "salatlar" },
  { name: "Селедка под шубой", weight: "250 гр", price: 40000, tag: "salatlar" },
  { name: "Мимоза", weight: "250 гр", price: 40000, tag: "salatlar" },
  { name: "Американский", weight: "250 гр", price: 40000, tag: "salatlar" },
  { name: "Бахор салати", weight: "200 гр", price: 20000, tag: "salatlar" },
];

async function main() {
  // Ensure 3 sections exist (update names if already present)
  const existing = await pool.query("SELECT id, sort_order FROM sections ORDER BY sort_order, id");
  const byOrder = new Map(existing.rows.map((r: { id: number; sort_order: number }) => [r.sort_order, r.id]));

  const sectionIds: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
  for (const s of SECTIONS) {
    const knownId = byOrder.get(s.sort_order);
    if (knownId) {
      await pool.query(`UPDATE sections SET name = $1 WHERE id = $2`, [
        serializeTranslation(s.name),
        knownId,
      ]);
      sectionIds[s.sort_order as 1 | 2 | 3] = knownId;
    } else {
      const { rows } = await pool.query(
        `INSERT INTO sections (name, sort_order) VALUES ($1, $2) RETURNING id`,
        [serializeTranslation(s.name), s.sort_order],
      );
      sectionIds[s.sort_order as 1 | 2 | 3] = rows[0].id;
    }
  }

  await pool.query("DELETE FROM menu_items");
  await pool.query("DELETE FROM categories");

  const tagToId = new Map<string, number>();
  for (const c of CATEGORIES) {
    const { rows } = await pool.query(
      `INSERT INTO categories (name, sort_order, section_id)
       VALUES ($1, $2, $3) RETURNING id`,
      [serializeTranslation(c.name), c.order, sectionIds[c.section]],
    );
    tagToId.set(c.tag, rows[0].id);
  }

  const fullSeed = await loadFullSeed();
  let inserted = 0;
  for (const it of fullSeed) {
    const categoryId = tagToId.get(it.tag);
    if (!categoryId) continue;
    const title = { uz: it.name, ru: it.name, en: it.name };
    await pool.query(
      `INSERT INTO menu_items (category_id, title, photo, weight, price)
       VALUES ($1, $2, $3, $4, $5)`,
      [categoryId, serializeTranslation(title), "", it.weight || "", it.price],
    );
    inserted++;
  }

  const admins = await pool.query("SELECT id FROM admins LIMIT 1");
  if (admins.rows.length === 0) {
    const hash = await bcrypt.hash("Jamshid123", 10);
    await pool.query(
      `INSERT INTO admins (admin_name, password, admin_role) VALUES ($1,$2,$3)`,
      ["Jamshid", hash, "super"],
    );
  }

  console.log(`Seeded ${CATEGORIES.length} categories, ${inserted} menu items`);
  await pool.end();
}

async function loadFullSeed(): Promise<SeedItem[]> {
  // Prefer reconstructing from previous commit via child process if file exists in history
  try {
    const { execSync } = await import("node:child_process");
    const raw = execSync(
      "git -C .. show 3d43ea4:src/data/seedItems.ts",
      { encoding: "utf8" },
    );
    const matches = [
      ...raw.matchAll(
        /\{\s*name:\s*'([^']*)',\s*weight:\s*'([^']*)',\s*price:\s*(\d+),\s*tag:\s*'([^']*)'\s*\}/g,
      ),
    ];
    if (matches.length > 0) {
      return matches.map((m) => ({
        name: m[1],
        weight: m[2],
        price: Number(m[3]),
        tag: m[4],
      }));
    }
  } catch {
    /* fall through */
  }
  return SEED_ITEMS;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
