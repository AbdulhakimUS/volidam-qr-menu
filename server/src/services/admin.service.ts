import bcrypt from "bcryptjs";
import type { Admin, CreateAdminDTO } from "../types/admin.js";
import {
  createAdmin as createAdminRepo,
  deleteAdmin as deleteAdminRepo,
  findAdminById,
  findAllAdmins,
  updateAdminPassword as updateAdminPasswordRepo,
  updateAdminStatus as updateAdminStatusRepo,
  updateAdminUsername as updateAdminUsernameRepo,
} from "../repositories/admin.repository.js";
import { badRequest, forbidden, notFound } from "../utils/response.js";

function publicAdmin(admin: Admin): Omit<Admin, "password"> {
  const { password: _password, ...rest } = admin;
  return rest;
}

export async function getAdmins(): Promise<Omit<Admin, "password">[]> {
  const admins = await findAllAdmins();
  return admins.map(publicAdmin);
}

export async function getAdmin(id: number): Promise<Omit<Admin, "password">> {
  const admin = await findAdminById(id);
  if (!admin) {
    throw notFound("Admin topilmadi");
  }

  return publicAdmin(admin);
}

export async function addAdmin(
  payload: CreateAdminDTO,
): Promise<Omit<Admin, "password">> {
  const username = payload.username?.trim() ?? "";
  const password = payload.password?.trim() ?? "";
  const adminStatus = payload.admin_status ?? "admin";

  if (!username) {
    throw badRequest("Foydalanuvchi nomi kiritilishi shart");
  }

  if (!password) {
    throw badRequest("Parol kiritilishi shart");
  }

  if (adminStatus !== "admin" && adminStatus !== "super") {
    throw badRequest("Noto'g'ri admin holati");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const created = await createAdminRepo({
    username,
    password: hashedPassword,
    admin_status: adminStatus,
  });

  return publicAdmin(created);
}

function assertCanEdit(
  actorId: number,
  actorStatus: "super" | "admin",
  targetId: number,
) {
  if (actorStatus === "super") return;
  if (actorId !== targetId) {
    throw forbidden("Ruxsat yo'q");
  }
}

export async function updateAdminUsername(
  id: number,
  username: string,
  actor: { id: number; status: "super" | "admin" },
): Promise<Omit<Admin, "password">> {
  assertCanEdit(actor.id, actor.status, id);

  const trimmedUsername = username?.trim() ?? "";
  if (!trimmedUsername) {
    throw badRequest("Foydalanuvchi nomi bo'sh bo'lishi mumkin emas");
  }

  const admin = await updateAdminUsernameRepo(trimmedUsername, id);
  if (!admin) {
    throw notFound("Admin topilmadi");
  }

  return publicAdmin(admin);
}

export async function updateAdminPassword(
  id: number,
  password: string,
  actor: { id: number; status: "super" | "admin" },
): Promise<Omit<Admin, "password">> {
  assertCanEdit(actor.id, actor.status, id);

  const trimmedPassword = password?.trim() ?? "";
  if (!trimmedPassword) {
    throw badRequest("Parol bo'sh bo'lishi mumkin emas");
  }

  const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
  const admin = await updateAdminPasswordRepo(hashedPassword, id);
  if (!admin) {
    throw notFound("Admin topilmadi");
  }

  return publicAdmin(admin);
}

export async function updateAdminStatus(
  id: number,
  adminStatus: "super" | "admin",
): Promise<Omit<Admin, "password">> {
  if (adminStatus !== "admin" && adminStatus !== "super") {
    throw badRequest("Noto'g'ri admin holati");
  }

  const admin = await updateAdminStatusRepo(adminStatus, id);
  if (!admin) {
    throw notFound("Admin topilmadi");
  }

  return publicAdmin(admin);
}

export async function removeAdmin(id: number): Promise<void> {
  const deleted = await deleteAdminRepo(id);
  if (!deleted) {
    throw notFound("Admin topilmadi");
  }
}
