import pool from "../config/postgresql.js";
import type { Admin, CreateAdminDTO } from "../types/admin.js";

type AdminRow = {
  id: number;
  admin_name: string;
  password: string;
  admin_role: "super" | "admin";
};

function mapAdmin(row: AdminRow): Admin {
  return {
    id: row.id,
    username: row.admin_name,
    password: row.password,
    admin_status: row.admin_role,
  };
}

const BASE_QUERY =
  "SELECT id, admin_name, password, admin_role FROM admins";
const RETURNING_QUERY =
  "RETURNING id, admin_name, password, admin_role";

export async function findAllAdmins(): Promise<Admin[]> {
  const { rows } = await pool.query(BASE_QUERY);
  return (rows as AdminRow[]).map(mapAdmin);
}

export async function findAdminById(id: number): Promise<Admin | null> {
  const { rows } = await pool.query(`${BASE_QUERY} WHERE id = $1`, [id]);
  return rows[0] ? mapAdmin(rows[0] as AdminRow) : null;
}

export async function findAdminByUsername(
  username: string,
): Promise<Admin | null> {
  const { rows } = await pool.query(
    `${BASE_QUERY} WHERE LOWER(admin_name) = LOWER($1)`,
    [username],
  );
  return rows[0] ? mapAdmin(rows[0] as AdminRow) : null;
}

export async function deleteAdmin(id: number): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM admins WHERE id = $1", [
    id,
  ]);
  return (rowCount ?? 0) > 0;
}

export async function updateAdminUsername(
  username: string,
  id: number,
): Promise<Admin | null> {
  const { rows } = await pool.query(
    `UPDATE admins SET admin_name = $1 WHERE id = $2 ${RETURNING_QUERY}`,
    [username, id],
  );
  return rows[0] ? mapAdmin(rows[0] as AdminRow) : null;
}

export async function updateAdminPassword(
  password: string,
  id: number,
): Promise<Admin | null> {
  const { rows } = await pool.query(
    `UPDATE admins SET password = $1 WHERE id = $2 ${RETURNING_QUERY}`,
    [password, id],
  );
  return rows[0] ? mapAdmin(rows[0] as AdminRow) : null;
}

export async function updateAdminStatus(
  adminStatus: "super" | "admin",
  id: number,
): Promise<Admin | null> {
  const { rows } = await pool.query(
    `UPDATE admins SET admin_role = $1 WHERE id = $2 ${RETURNING_QUERY}`,
    [adminStatus, id],
  );
  return rows[0] ? mapAdmin(rows[0] as AdminRow) : null;
}

export async function createAdmin(admin: CreateAdminDTO): Promise<Admin> {
  const { rows } = await pool.query(
    `INSERT INTO admins (admin_name, password, admin_role) VALUES ($1, $2, $3) ${RETURNING_QUERY}`,
    [admin.username, admin.password, admin.admin_status],
  );
  return mapAdmin(rows[0] as AdminRow);
}

export async function countAdmins(): Promise<number> {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM admins");
  return rows[0]?.count ?? 0;
}
