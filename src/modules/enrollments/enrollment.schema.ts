// Enrollment Schema
// Zod schemas for enrollment validation
import { z } from "zod";

export const EnrollmentSchema = z.object({
  user_id: z.string().uuid(),
  product_id: z.string().uuid(),
  status: z.string(),
  // Add more fields as needed
});
