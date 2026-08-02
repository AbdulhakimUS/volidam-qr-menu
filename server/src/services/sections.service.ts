import type {
    Section,
    CreateSectionDTO,
    UpdateSectionDTO,
} from "../types/section.js";
import {
    createSection as createSectionRepo,
    deleteSection as deleteSectionRepo,
    findAllSections,
    findSectionById,
    updateSection as updateSectionRepo,
} from "../repositories/sections.repository.js";
import { badRequest, notFound } from "../utils/response.js";

export async function getSections(): Promise<Section[]> {
    return findAllSections();
}

export async function getSection(id: number): Promise<Section> {
    const section = await findSectionById(id);
    if (!section) {
        throw notFound("Bo'lim topilmadi");
    }
    return section;
}

export async function addSection(payload: CreateSectionDTO): Promise<Section> {
    const name = payload.name;
    const isEmpty = !name?.uz?.trim() && !name?.ru?.trim() && !name?.en?.trim();
    if (isEmpty) {
        throw badRequest("Nomi kiritilishi shart");
    }

    return createSectionRepo({
        name,
        sort_order: payload.sort_order,
    });
}

export async function editSection(
    id: number,
    payload: UpdateSectionDTO,
): Promise<Section> {
    if (payload.name !== undefined) {
        const name = payload.name;
        const isEmpty = !name?.uz?.trim() && !name?.ru?.trim() && !name?.en?.trim();
        if (isEmpty) {
            throw badRequest("Nomi bo'sh bo'lishi mumkin emas");
        }
    }

    const section = await updateSectionRepo(id, payload);
    if (!section) {
        throw notFound("Bo'lim topilmadi");
    }
    return section;
}

export async function removeSection(id: number): Promise<void> {
    const deleted = await deleteSectionRepo(id);
    if (!deleted) {
        throw notFound("Bo'lim topilmadi");
    }
}
