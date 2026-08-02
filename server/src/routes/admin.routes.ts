import { Router } from "express";
import {
  createAdmin,
  deleteAdmin,
  getAdminById,
  getAllAdmins,
  updateAdminPassword,
  updateAdminStatus,
  updateAdminUsername,
} from "../controllers/admin.controller.js";
import {
  authMiddleware,
  requireMainAdmin,
} from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requireMainAdmin, getAllAdmins);
router.get("/:id", requireMainAdmin, getAdminById);
router.post("/", requireMainAdmin, createAdmin);
router.put("/:id/username", updateAdminUsername);
router.put("/:id/password", updateAdminPassword);
router.put("/:id/status", requireMainAdmin, updateAdminStatus);
router.delete("/:id", requireMainAdmin, deleteAdmin);

export default router;
