import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { success } from "../utils/response.js";
import asyncHandler from "../utils/asyncHandler.js";

export const login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body as { username: string; password: string });
    return success(res, result);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
    await authService.logout(res);
    return success(res, { message: "Tizimdan muvaffaqiyatli chiqildi" });
});
