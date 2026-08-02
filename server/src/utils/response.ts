import type { Response } from "express";
import { AppError } from "../middleware/errorHandler.js";

// Success response helpers
export function success(res: Response, data: any, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function created(res: Response, data: any) {
  return res.status(201).json({
    success: true,
    data,
  });
}

export function deleted(res: Response, message = "Resurs o'chirildi") {
  return res.status(200).json({
    success: true,
    message,
  });
}

// Error response helpers
export function notFound(message = "Resurs topilmadi") {
  return new AppError(message, 404);
}

export function badRequest(message = "So'rov noto'g'ri") {
  return new AppError(message, 400);
}

export function conflict(message = "Qayta kelish/konflikt") {
  return new AppError(message, 409);
}

export function unauthorized(message = "Avtorizatsiya talab qilinadi") {
  return new AppError(message, 401);
}

export function forbidden(message = "Ruxsat yo'q") {
  return new AppError(message, 403);
}
