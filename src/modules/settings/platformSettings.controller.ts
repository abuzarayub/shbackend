// Platform Settings Controller
// Handles platform settings endpoints
import { PlatformSettingsService } from "./platformSettings.service";
import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../../utils/Logger";

const platformSettingsService = new PlatformSettingsService();

export class PlatformSettingsController {
  // Get platform settings
  async getSettings(req: FastifyRequest, res: FastifyReply) {
    logger.info(
      { admin: req.user?.id },
      "Get platform settings request received"
    );
    try {
      const settings = await platformSettingsService.getSettings();
      logger.info({ settings }, "Platform settings fetched successfully");
      res.send(settings);
    } catch (err) {
      logger.error({ err }, "Failed to get platform settings");
      res.status(500).send({ error: "Failed to get platform settings" });
    }
  }

  // Update platform settings
  async updateSettings(req: FastifyRequest, res: FastifyReply) {
    logger.info(
      { admin: req.user?.id, body: req.body },
      "Update platform settings request received"
    );
    try {
      const data = req.body;
      const result = await platformSettingsService.updateSettings(data);
      logger.info({ result }, "Platform settings updated successfully");
      res.send(result);
    } catch (err) {
      logger.error({ err }, "Failed to update platform settings");
      res.status(500).send({ error: "Failed to update platform settings" });
    }
  }
}
