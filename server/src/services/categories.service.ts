import type {
  Category,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from "../types/category.js";

import {
  createCategory as createCategoryRepo,
  deleteCategory as deleteCategoryRepo,
  findAllCategories,
  findCategoryById,
  updateCategory as updateCategoryRepo,
} from "../repositories/categories.repository.js";
import { badRequest, notFound } from "../utils/response.js";

export async function getCategories() {
  return findAllCategories();
}

export async function getCategory(id: number): Promise<Category> {
  const category = await findCategoryById(id);
  if (!category) {
    throw notFound("Kategoriya topilmadi");
  }
  return category;
}

export async function addCategory(
  payload: CreateCategoryDTO,
): Promise<Category> {
  const name = payload.name;
  const isEmpty = !name?.uz?.trim() && !name?.ru?.trim() && !name?.en?.trim();
  if (isEmpty) {
    throw badRequest("Nomi kiritilishi shart");
  }

  return createCategoryRepo(payload);
}

export async function editCategory(
  id: number,
  payload: UpdateCategoryDTO,
): Promise<Category> {
  if (payload.name !== undefined) {
    const name = payload.name;
    const isEmpty = !name?.uz?.trim() && !name?.ru?.trim() && !name?.en?.trim();
    if (isEmpty) {
      throw badRequest("Nomi bo'sh bo'lishi mumkin emas");
    }
  }

  const category = await updateCategoryRepo(id, payload);
  if (!category) {
    throw notFound("Kategoriya topilmadi");
  }
  return category;
}

export async function removeCategory(id: number): Promise<void> {
  const deleted = await deleteCategoryRepo(id);
  if (!deleted) {
    throw notFound("Kategoriya topilmadi");
  }
}
