import { Router } from "express";
import {
  createSection,
  deleteSection,
  getAllSections,
  getSectionById,
  updateSection,
} from "../controllers/sections.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getAllSections);
router.get("/:id", getSectionById);
router.post("/", authMiddleware, createSection);
router.put("/:id", authMiddleware, updateSection);
router.delete("/:id", authMiddleware, deleteSection);

export default router;
