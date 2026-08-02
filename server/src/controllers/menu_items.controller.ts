import type { Request, Response } from "express";
import type {
    CreateMenuItemDTO,
    UpdateMenuItemDTO,
} from "../types/menu_item.js";
import * as menuItemsService from "../services/menu_items.service.js";
import { created, deleted, success } from "../utils/response.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAllMenuItems = asyncHandler(
    async (_req: Request, res: Response) => {
        const menuItems = await menuItemsService.getMenuItems();
        return success(res, menuItems);
    },
);

export const getMenuItemById = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
        const id = Number(req.params.id);
        const menuItem = await menuItemsService.getMenuItem(id);
        return success(res, menuItem);
    },
);

export const createMenuItem = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
        const menuItem = await menuItemsService.addMenuItem(
            req.body as CreateMenuItemDTO,
        );
        return created(res, menuItem);
    },
);

export const updateMenuItem = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
        const id = Number(req.params.id);
        const menuItem = await menuItemsService.editMenuItem(
            id,
            req.body as UpdateMenuItemDTO,
        );
        return success(res, menuItem);
    },
);

export const deleteMenuItem = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
        const id = Number(req.params.id);
        await menuItemsService.removeMenuItem(id);
        return deleted(res, "Menyu elementi o'chirildi");
    },
);
