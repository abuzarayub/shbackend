// Community Schema
// Zod schemas for community validation
import { z } from "zod";

export const CollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  // Add more fields as needed
});
