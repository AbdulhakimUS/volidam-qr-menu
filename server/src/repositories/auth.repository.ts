import type { Response } from "express";
import { findAdminByUsername } from "./admin.repository.js";
import type { Admin } from "../types/admin.js";

export async function loginAdmin(username: string): Promise<Admin | null> {
  return findAdminByUsername(username);
}

export async function logoutAdmin(res: Response): Promise<boolean> {
  res.clearCookie("token");
  return true;
}
