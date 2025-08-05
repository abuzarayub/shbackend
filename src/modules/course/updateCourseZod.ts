import { z } from "zod";
import fromZodSchema from "zod-to-json-schema";

// ✅ Schema for fields allowed during course update
export const updateCourseZod = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .optional(),
  thumbnail_url: z.string().url("Thumbnail must be a valid URL").optional(),
  price: z.number().nonnegative("Price cannot be negative").optional(),
  is_published: z.boolean().optional(),
});

// ✅ For Fastify request validation
export const updateCourseSchema = z.object({
  body: updateCourseZod,
  params: z.object({
    id: z.string().uuid("Course ID must be a valid UUID"),
  }),
});

// ✅ JSON Schema version for Fastify route schema
export const updateCourseJSONSchema = fromZodSchema(updateCourseSchema);
