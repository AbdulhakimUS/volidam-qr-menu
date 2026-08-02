import type {
    MenuItem,
    CreateMenuItemDTO,
    UpdateMenuItemDTO,
} from "../types/menu_item.js";
import pool from "../config/postgresql.js";
import { parseTranslation, serializeTranslation } from "../utils/translations.js";

const BASE_QUERY = "SELECT id, category_id, title, photo, weight, price FROM menu_items";

export async function findAllMenuItems(): Promise<MenuItem[]> {
    const result = await pool.query(`${BASE_QUERY} ORDER BY id ASC`);
    return result.rows.map((row) => ({
        ...row,
        price: Number(row.price),
        title: parseTranslation(row.title),
        photo: row.photo || "",
    }));
}

export async function findMenuItemById(id: number): Promise<MenuItem | null> {
    const result = await pool.query(`${BASE_QUERY} WHERE id = $1`, [id]);
    const row = result.rows[0];
    return row
        ? {
              ...row,
              price: Number(row.price),
              title: parseTranslation(row.title),
              photo: row.photo || "",
          }
        : null;
}

export async function createMenuItem(
    menuItem: CreateMenuItemDTO,
): Promise<MenuItem> {
    const result = await pool.query(
        "INSERT INTO menu_items (category_id, title, photo, weight, price) VALUES ($1, $2, $3, $4, $5) RETURNING id, category_id, title, photo, weight, price",
        [
            menuItem.category_id,
            serializeTranslation(menuItem.title),
            menuItem.photo,
            menuItem.weight,
            menuItem.price,
        ],
    );
    const row = result.rows[0];
    return {
        ...row,
        price: Number(row.price),
        title: parseTranslation(row.title),
        photo: row.photo || "",
    };
}

export async function updateMenuItem(
    id: number,
    menuItem: UpdateMenuItemDTO,
): Promise<MenuItem | null> {
    const fields = [] as string[];
    const values: Array<string | number> = [];

    if (menuItem.category_id !== undefined) {
        values.push(menuItem.category_id);
        fields.push(`category_id = $${values.length}`);
    }

    if (menuItem.title !== undefined) {
        values.push(serializeTranslation(menuItem.title));
        fields.push(`title = $${values.length}`);
    }

    if (menuItem.photo !== undefined) {
        values.push(menuItem.photo);
        fields.push(`photo = $${values.length}`);
    }

    if (menuItem.weight !== undefined) {
        values.push(menuItem.weight);
        fields.push(`weight = $${values.length}`);
    }

    if (menuItem.price !== undefined) {
        values.push(menuItem.price);
        fields.push(`price = $${values.length}`);
    }

    if (fields.length === 0) {
        return findMenuItemById(id);
    }

    values.push(id);
    const result = await pool.query(
        `UPDATE menu_items SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING id, category_id, title, photo, weight, price`,
        values,
    );

    const row = result.rows[0];
    return row
        ? {
              ...row,
              price: Number(row.price),
              title: parseTranslation(row.title),
              photo: row.photo || "",
          }
        : null;
}

export async function deleteMenuItem(id: number): Promise<boolean> {
    const result = await pool.query("DELETE FROM menu_items WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
}
