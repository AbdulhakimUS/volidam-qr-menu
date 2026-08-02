import { Router, type Request, type Response } from "express";
import adminRoutes from "./admin.routes.js";
import authRoutes from "./auth.routes.js";
import categoriesRoutes from "./categories.routes.js";
import menuItemsRoutes from "./menu_items.routes.js";
import sectionsRoutes from "./sections.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admins", adminRoutes);
router.use("/categories", categoriesRoutes);
router.use("/menu-items", menuItemsRoutes);
router.use("/sections", sectionsRoutes);

router.get("/health", (_: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
