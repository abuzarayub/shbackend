// Progress Routes
// Registers user progress endpoints
import { FastifyInstance } from "fastify";
import { ProgressController } from "./progress.controller";
import { authenticate } from "../../middleware/autheticate";

export async function progressRoutes(app: FastifyInstance) {
  const controller = new ProgressController();

  // Apply authentication to all progress routes
  app.addHook("preHandler", authenticate);

  // Get user progress for a product
  app.get("/progress/:productId", controller.getProgress);
  // Update user progress for a product
  app.patch("/progress/:productId", controller.updateProgress);
}
