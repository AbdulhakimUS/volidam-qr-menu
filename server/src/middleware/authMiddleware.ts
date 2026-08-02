/// <reference path="../../types/globals.d.ts" />
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { unauthorized, forbidden } from "../utils/response.js";

interface JwtPayload {
  id: string;
  status: "admin" | "super";
}

export const authMiddleware = (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next(unauthorized("Autentifikatsiya qilinmagan."));
  }

  try {
    req.admin = jwt.verify(token, ENV.JWT_ACCESS_SECRET as string) as JwtPayload;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return next(unauthorized("Token muddati tugagan yoki yaroqsiz"));
  }
};

export const requireMainAdmin = (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  if (req.admin?.status !== "super") {
    return next(forbidden("Asosiy admin ruxsati kerak."));
  }
  next();
};
