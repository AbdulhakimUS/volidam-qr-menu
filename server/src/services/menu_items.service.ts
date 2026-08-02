import type {
    MenuItem,
    CreateMenuItemDTO,
    UpdateMenuItemDTO,
} from "../types/menu_item.js";
import {
    createMenuItem as createMenuItemRepo,
    deleteMenuItem as deleteMenuItemRepo,
    findAllMenuItems,
    findMenuItemById,
    updateMenuItem as updateMenuItemRepo,
} from "../repositories/menu_items.repository.js";
import cloudinary from "../config/cloudinary.js";
import { badRequest, notFound } from "../utils/response.js";

async function uploadImage(imageValue: string): Promise<string> {
    const trimmedValue = imageValue?.trim() ?? "";

    if (!trimmedValue) {
        return "";
    }

    if (
        trimmedValue.includes("res.cloudinary.com") ||
        /^https?:\/\//i.test(trimmedValue)
    ) {
        if (trimmedValue.includes("res.cloudinary.com")) {
            return trimmedValue;
        }
        // Remote URL — let Cloudinary fetch & store a copy when credentials exist
    }

    const result = await cloudinary.uploader.upload(trimmedValue, {
        folder: "menu-items",
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    return result.secure_url;
}

export async function getMenuItems(): Promise<MenuItem[]> {
    return findAllMenuItems();
}

export async function getMenuItem(id: number): Promise<MenuItem> {
    const menuItem = await findMenuItemById(id);
    if (!menuItem) {
        throw notFound("Menyu elementi topilmadi");
    }
    return menuItem;
}

export async function addMenuItem(
    payload: CreateMenuItemDTO,
): Promise<MenuItem> {
    const title = payload.title;
    const isEmpty = !title?.uz?.trim() && !title?.ru?.trim() && !title?.en?.trim();
    if (isEmpty) {
        throw badRequest("Sarlavha kiritilishi shart");
    }

    const imageUrl = await uploadImage(payload.photo ?? "");

    return createMenuItemRepo({
        ...payload,
        photo: imageUrl || "",
    });
}

export async function editMenuItem(
    id: number,
    payload: UpdateMenuItemDTO,
): Promise<MenuItem> {
    if (payload.title !== undefined) {
        const title = payload.title;
        const isEmpty = !title?.uz?.trim() && !title?.ru?.trim() && !title?.en?.trim();
        if (isEmpty) {
            throw badRequest("Sarlavha bo'sh bo'lishi mumkin emas");
        }
    }

    const normalizedPayload: UpdateMenuItemDTO = { ...payload };

    if (payload.photo !== undefined) {
        normalizedPayload.photo = await uploadImage(payload.photo);
    }

    const menuItem = await updateMenuItemRepo(id, normalizedPayload);
    if (!menuItem) {
        throw notFound("Menyu elementi topilmadi");
    }
    return menuItem;
}

export async function removeMenuItem(id: number): Promise<void> {
    const deleted = await deleteMenuItemRepo(id);
    if (!deleted) {
        throw notFound("Menyu elementi topilmadi");
    }
}
