import pool from "../config/postgresql.js";
import type { Section, CreateSectionDTO, UpdateSectionDTO } from "../types/section.js";
import { parseTranslation, serializeTranslation } from "../utils/translations.js";

const BASE_QUERY = "SELECT id, name, sort_order FROM sections";

export async function findAllSections(): Promise<Section[]> {
    const { rows } = await pool.query(
        `${BASE_QUERY} ORDER BY sort_order ASC, id ASC`,
    );
    return rows.map((row) => ({
        ...row,
        name: parseTranslation(row.name),
    }));
}

export async function findSectionById(id: number): Promise<Section | null> {
    const { rows } = await pool.query(`${BASE_QUERY} WHERE id = $1`, [id]);
    const row = rows[0];
    return row ? { ...row, name: parseTranslation(row.name) } : null;
}

export async function createSection(
    section: CreateSectionDTO,
): Promise<Section> {
    const { rows } = await pool.query(
        "INSERT INTO sections (name, sort_order) VALUES ($1, $2) RETURNING id, name, sort_order",
        [serializeTranslation(section.name), section.sort_order],
    );
    const row = rows[0];
    return { ...row, name: parseTranslation(row.name) };
}

export async function updateSection(
    id: number,
    section: UpdateSectionDTO,
): Promise<Section | null> {
    const fields: string[] = [];
    const values: Array<string | number> = [];

    if (section.name !== undefined) {
        values.push(serializeTranslation(section.name));
        fields.push(`name = $${values.length}`);
    }

    if (section.sort_order !== undefined) {
        values.push(section.sort_order);
        fields.push(`sort_order = $${values.length}`);
    }

    if (fields.length === 0) {
        return findSectionById(id);
    }

    values.push(id);
    const { rows } = await pool.query(
        `UPDATE sections SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING id, name, sort_order`,
        values,
    );

    const row = rows[0];
    return row ? { ...row, name: parseTranslation(row.name) } : null;
}

export async function deleteSection(id: number): Promise<boolean> {
    const { rowCount } = await pool.query("DELETE FROM sections WHERE id = $1", [
        id,
    ]);
    return (rowCount ?? 0) > 0;
}
