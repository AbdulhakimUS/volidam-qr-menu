import type { Request, Response, NextFunction } from "express";
import type {
    CreateCategoryDTO,
    UpdateCategoryDTO,
} from "../types/category.js";
import * as categoriesService from "../services/categories.service.js";
import { created, deleted, success } from "../utils/response.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAllCategories = asyncHandler(
    async (_req: Request, res: Response) => {
        const categories = await categoriesService.getCategories();
        return success(res, categories);
    },
);

export const getCategoryById = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
        const id = Number(req.params.id);
        const category = await categoriesService.getCategory(id);
        return success(res, category);
    },
);

export const createCategory = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
        const category = await categoriesService.addCategory(
            req.body as CreateCategoryDTO,
        );

        return created(res, category);
    },
);

export const updateCategory = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
        const categoryId = Number(req.params.id);

        const category = await categoriesService.editCategory(
            categoryId,
            req.body as UpdateCategoryDTO,
        );
        return success(res, category);
    },
);

export const deleteCategory = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
        const id = Number(req.params.id);
        await categoriesService.removeCategory(id);
        return deleted(res, "Kategoriya o'chirildi");
    },
);
