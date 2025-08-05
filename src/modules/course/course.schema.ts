import { z } from "zod";
import fromZodSchema from "zod-to-json-schema";

// ✅ Zod schema for validation
export const createCourseZod = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(5, "Title must be at least 5 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters"),
  thumbnail_url: z.string().url("Thumbnail must be a valid URL"), // required
  price: z.number().nonnegative("Price cannot be negative"),
  is_published: z.boolean(), // required
  school_id: z.string().uuid("school_id must be a valid UUID").optional(),
  status: z.enum(["draft", "pending", "approved", "rejected"]).optional(),
});

// ✅ Zod wrapper for Fastify use
export const createCourseSchema = z.object({
  body: createCourseZod,
});

// ✅ JSON Schema for Fastify
export const createCourseJSONSchema = fromZodSchema(createCourseZod);
