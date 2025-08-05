// Payout Controller
// Handles instructor payout endpoints
import { PayoutService } from "./payout.service";
import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../../utils/Logger";
import { publishToQueue } from "../../utils/rabbitmqClient";

const payoutService = new PayoutService();

export class PayoutController {
  // Create an instructor payout
  async createPayout(req: FastifyRequest, res: FastifyReply) {
    logger.info(
      { admin: req.user?.id, body: req.body },
      "Create payout request received"
    );
    try {
      const adminId = req.user?.id;
      const data = req.body;
      const payout = await payoutService.createPayout(adminId || "", data);
      logger.info({ payout }, "Payout created successfully");
      await publishToQueue("payout_events", {
        type: "payout_created",
        adminId,
        data,
      });
      logger.info(
        { queue: "payout_events", adminId, data },
        "Payout event pushed to RabbitMQ"
      );
      res.send(payout);
    } catch (err) {
      logger.error({ err }, "Failed to create payout");
      res.status(500).send({ error: "Failed to create payout" });
    }
  }

  // Get instructor payouts
  async getPayouts(req: FastifyRequest, res: FastifyReply) {
    logger.info({ admin: req.user?.id }, "Get payouts request received");
    try {
      const payouts = await payoutService.getPayouts();
      logger.info({ payouts }, "Payouts fetched successfully");
      res.send(payouts);
    } catch (err) {
      logger.error({ err }, "Failed to get payouts");
      res.status(500).send({ error: "Failed to get payouts" });
    }
  }
}
