// LearnWorlds Webhook Controller
// Handles LearnWorlds webhook ingestion
import { logger } from "../utils/Logger";
import { publishToQueue } from "../utils/rabbitmqClient";
import { FastifyRequest, FastifyReply } from "fastify";

export async function learnworldsWebhookHandler(
  req: FastifyRequest,
  res: FastifyReply
) {
  logger.info(
    { headers: req.headers, body: req.body },
    "LearnWorlds webhook received"
  );
  try {
    const event = req.body;
    // Optionally validate event here
    await publishToQueue("webhook_processing_queue", event);
    logger.info(
      { queue: "webhook_processing_queue", event },
      "Webhook event pushed to RabbitMQ"
    );
    res.send({ status: "ok" });
  } catch (err) {
    logger.error({ err }, "Failed to process LearnWorlds webhook");
    res.status(500).send({ error: "Failed to process webhook" });
  }
}
