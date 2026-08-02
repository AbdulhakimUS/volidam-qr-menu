import type { Request, Response } from "express";
import type { CreateAdminDTO } from "../types/admin.js";
import * as adminService from "../services/admin.service.js";
import { created, deleted, success } from "../utils/response.js";
import asyncHandler from "../utils/asyncHandler.js";
import { unauthorized } from "../utils/response.js";

function actorFromReq(req: Request) {
  if (!req.admin) {
    throw unauthorized("Avtorizatsiya talab qilinadi");
  }
  return {
    id: Number(req.admin.id),
    status: req.admin.status,
  };
}

export const getAllAdmins = asyncHandler(
  async (_req: Request, res: Response) => {
    const admins = await adminService.getAdmins();
    return success(res, admins);
  },
);

export const getAdminById = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const admin = await adminService.getAdmin(id);
    return success(res, admin);
  },
);

export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  const admin = await adminService.addAdmin(req.body as CreateAdminDTO);
  return created(res, admin);
});

export const updateAdminUsername = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const admin = await adminService.updateAdminUsername(
      id,
      req.body.username as string,
      actorFromReq(req),
    );

    return success(res, admin);
  },
);

export const updateAdminPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const admin = await adminService.updateAdminPassword(
      id,
      req.body.password as string,
      actorFromReq(req),
    );

    return success(res, admin);
  },
);

export const updateAdminStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const admin = await adminService.updateAdminStatus(
      id,
      req.body.admin_status as "super" | "admin",
    );
    return success(res, admin);
  },
);

export const deleteAdmin = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await adminService.removeAdmin(id);
  return deleted(res, "Admin o'chirildi");
});
