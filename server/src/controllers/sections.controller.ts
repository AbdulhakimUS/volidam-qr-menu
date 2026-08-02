import type { Request, Response } from "express";
import type {
    CreateSectionDTO,
    UpdateSectionDTO,
} from "../types/section.js";
import * as sectionsService from "../services/sections.service.js";
import { created, deleted, success } from "../utils/response.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAllSections = asyncHandler(
    async (_req: Request, res: Response) => {
        const sections = await sectionsService.getSections();
        return success(res, sections);
    },
);

export const getSectionById = asyncHandler(
    async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const section = await sectionsService.getSection(id);
        return success(res, section);
    },
);

export const createSection = asyncHandler(
    async (req: Request, res: Response) => {
        const section = await sectionsService.addSection(
            req.body as CreateSectionDTO,
        );
        return created(res, section);
    },
);

export const updateSection = asyncHandler(
    async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const section = await sectionsService.editSection(
            id,
            req.body as UpdateSectionDTO,
        );
        return success(res, section);
    },
);

export const deleteSection = asyncHandler(
    async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        await sectionsService.removeSection(id);
        return deleted(res, "Bo'lim o'chirildi");
    },
);
