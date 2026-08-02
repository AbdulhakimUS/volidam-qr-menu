import type {
  Category,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from "../types/category.js";
import pool from "../config/postgresql.js";
import { parseTranslation, serializeTranslation } from "../utils/translations.js";

type CategoryRow = {
  id: number;
  name: string;
  sort_order: number;
  section_id: number | null;
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: parseTranslation(row.name),
    order: row.sort_order,
    sectionId: row.section_id ?? 0,
  };
}

const BASE_QUERY =
  "SELECT id, name, sort_order, section_id FROM categories";

export async function findAllCategories(): Promise<Category[]> {
  const result = await pool.query(`${BASE_QUERY} ORDER BY sort_order ASC, id ASC`);
  return (result.rows as CategoryRow[]).map(mapCategory);
}

export async function findCategoryById(id: number): Promise<Category | null> {
  const result = await pool.query(`${BASE_QUERY} WHERE id = $1`, [id]);
  const row = result.rows[0] as CategoryRow | undefined;
  return row ? mapCategory(row) : null;
}

export async function createCategory(
  category: CreateCategoryDTO,
): Promise<Category> {
  const result = await pool.query(
    "INSERT INTO categories (name, sort_order, section_id) VALUES ($1, $2, $3) RETURNING id, name, sort_order, section_id",
    [
      serializeTranslation(category.name),
      category.order,
      category.sectionId,
    ],
  );
  return mapCategory(result.rows[0] as CategoryRow);
}

export async function updateCategory(
  id: number,
  category: UpdateCategoryDTO,
): Promise<Category | null> {
  const fields = [] as string[];
  const values: Array<string | number> = [];

  if (category.name !== undefined) {
    values.push(serializeTranslation(category.name));
    fields.push(`name = $${values.length}`);
  }

  if (category.order !== undefined) {
    values.push(category.order);
    fields.push(`sort_order = $${values.length}`);
  }

  if (category.sectionId !== undefined) {
    values.push(category.sectionId);
    fields.push(`section_id = $${values.length}`);
  }

  if (fields.length === 0) {
    return findCategoryById(id);
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE categories SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING id, name, sort_order, section_id`,
    values,
  );

  const row = result.rows[0] as CategoryRow | undefined;
  return row ? mapCategory(row) : null;
}

export async function deleteCategory(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM categories WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
