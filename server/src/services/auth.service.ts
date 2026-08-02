import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Response } from "express";
import { ENV } from "../config/env.js";
import { loginAdmin, logoutAdmin } from "../repositories/auth.repository.js";
import {
  countAdmins,
  createAdmin,
} from "../repositories/admin.repository.js";
import { badRequest, unauthorized } from "../utils/response.js";

interface LoginPayload {
  username: string;
  password: string;
}

let seedPromise: Promise<void> | null = null;

async function ensureSeedAdmin() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await countAdmins();
      if (count > 0) return;
      const hashed = await bcrypt.hash(ENV.ADMIN_PASSWORD, 10);
      await createAdmin({
        username: ENV.ADMIN_USERNAME,
        password: hashed,
        admin_status: "super",
      });
    })().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  await seedPromise;
}

export async function login(payload: LoginPayload): Promise<{
  token: string;
  admin: { id: number; username: string; admin_status: "super" | "admin" };
}> {
  await ensureSeedAdmin();

  const username = payload.username?.trim() ?? "";
  const password = payload.password?.trim() ?? "";

  if (!username || !password) {
    throw badRequest("Foydalanuvchi nomi va parol kiritilishi shart");
  }

  const admin = await loginAdmin(username);
  if (!admin) {
    throw unauthorized("Foydalanuvchi nomi yoki parol noto'g'ri");
  }

  let isPasswordValid = false;
  if (admin.password.startsWith("$2")) {
    isPasswordValid = await bcrypt.compare(password, admin.password);
  } else {
    // Legacy plaintext passwords — accept once, then upgrade to bcrypt
    isPasswordValid = admin.password === password;
    if (isPasswordValid) {
      const hashed = await bcrypt.hash(password, 10);
      const { updateAdminPassword } = await import(
        "../repositories/admin.repository.js"
      );
      await updateAdminPassword(hashed, admin.id);
    }
  }
  if (!isPasswordValid) {
    throw unauthorized("Foydalanuvchi nomi yoki parol noto'g'ri");
  }

  const token = jwt.sign(
    { id: admin.id, status: admin.admin_status },
    ENV.JWT_ACCESS_SECRET,
    { expiresIn: "2h" },
  );

  return {
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      admin_status: admin.admin_status,
    },
  };
}

export async function logout(res: Response): Promise<void> {
  const cleared = await logoutAdmin(res);
  if (!cleared) {
    throw badRequest("Tizimdan chiqish imkoni bo'lmadi");
  }
}
