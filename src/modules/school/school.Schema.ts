/**
 * Zod schema for school creation and update.
 */
import { z } from "zod";

export const createSchoolSchema = z.object({
  name: z
    .string()
    .min(2, "School name is required and must be at least 2 characters"),
});

export const updateSchoolSchema = z.object({
  name: z
    .string()
    .min(2, "School name is required and must be at least 2 characters")
    .optional(),
});
