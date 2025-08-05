// Progress Controller
// Handles user progress endpoints
import { ProgressService } from "./progress.service";
import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../../utils/Logger";
import { publishToQueue } from "../../utils/rabbitmqClient";

const progressService = new ProgressService();

export class ProgressController {
  // Get user progress for a product
  async getProgress(req: FastifyRequest, res: FastifyReply) {
    logger.info(
      { user: req.user?.id, params: req.params },
      "Get progress request received"
    );
    try {
      const userId = req.user?.id;
      const productId = (req.params as any).productId;
      const progress = await progressService.getProgress(
        userId || "",
        productId
      );
      logger.info({ progress }, "User progress fetched successfully");
      res.send(progress);
    } catch (err) {
      logger.error({ err }, "Failed to get user progress");
      res.status(500).send({ error: "Failed to get progress" });
    }
  }

  // Update user progress for a product
  async updateProgress(req: FastifyRequest, res: FastifyReply) {
    logger.info(
      { user: req.user?.id, params: req.params, body: req.body },
      "Update progress request received"
    );
    try {
      const userId = req.user?.id;
      const productId = (req.params as any).productId;
      const data = req.body;
      const progress = await progressService.updateProgress(
        userId || "",
        productId,
        data
      );
      logger.info({ progress }, "User progress updated successfully");
      await publishToQueue("progress_events", {
        type: "progress_updated",
        userId: userId || "",
        productId,
        data,
      });
      logger.info(
        { queue: "progress_events", userId: userId || "", productId },
        "Progress event pushed to RabbitMQ"
      );
      res.send(progress);
    } catch (err) {
      logger.error({ err }, "Failed to update user progress");
      res.status(500).send({ error: "Failed to update progress" });
    }
  }
}
