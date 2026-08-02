import jwt from "jsonwebtoken";
import type { Response } from "express";
import { ENV } from "../config/env.js";

// Generate JWT tokens
export const generateToken = async (
  adminId: number,
  status: "admin" | "super",
  res: Response,
) => {
  if (!ENV.JWT_ACCESS_SECRET || !ENV.JWT_REFRESH_SECRET) {
    throw {
      status: 500,
      message:
        "JWT_ACCESS_SECRET yoki JWT_REFRESH_SECRET muhit o'zgaruvchilari ichida aniqlanmagan",
    };
  }

  const token = jwt.sign({ adminId, status }, ENV.JWT_REFRESH_SECRET, {
    expiresIn: "2h",
  });

  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
  });

  return token;
};
