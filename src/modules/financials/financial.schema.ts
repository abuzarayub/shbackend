// Financial Schema
// Zod schemas for financial validation
import { z } from "zod";

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number(),
  status: z.string(),
  // Add more fields as needed
});
