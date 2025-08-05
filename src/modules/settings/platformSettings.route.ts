// Platform Settings Routes
// Registers platform settings endpoints
import { FastifyInstance } from "fastify";
import { PlatformSettingsController } from "./platformSettings.controller";

export async function platformSettingsRoutes(app: FastifyInstance) {
  const controller = new PlatformSettingsController();
  // Get platform settings
  app.get("/api/admin/platform-settings", controller.getSettings);
  // Update platform settings
  app.patch("/api/admin/platform-settings", controller.updateSettings);
}
