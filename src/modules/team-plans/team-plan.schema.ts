// Team Plan Schema
// Zod schemas for team plan validation
import { z } from "zod";

export const TeamPlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  // Add more fields as needed
});
