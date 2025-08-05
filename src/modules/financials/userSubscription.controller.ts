// User Subscription Controller
// Handles user subscription endpoints
import { UserSubscriptionService } from "./userSubscription.service";
import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../../utils/Logger";
import { publishToQueue } from "../../utils/rabbitmqClient";

const userSubscriptionService = new UserSubscriptionService();

export class UserSubscriptionController {
  // Create a user subscription
  async createUserSubscription(req: FastifyRequest, res: FastifyReply) {
    logger.info(
      { user: req.user?.id, body: req.body },
      "Create user subscription request received"
    );
    try {
      const userId = req.user?.id;
      const data = req.body;
      const subscription = await userSubscriptionService.createUserSubscription(
        userId || "",
        data
      );
      logger.info({ subscription }, "User subscription created successfully");
      await publishToQueue("user_subscription_events", {
        type: "user_subscription_created",
        userId: userId || "",
        data,
      });
      logger.info(
        { queue: "user_subscription_events", userId: userId || "", data },
        "User subscription event pushed to RabbitMQ"
      );
      res.send(subscription);
    } catch (err) {
      logger.error({ err }, "Failed to create user subscription");
      res.status(500).send({ error: "Failed to create user subscription" });
    }
  }

  // Get user subscriptions
  async getUserSubscriptions(req: FastifyRequest, res: FastifyReply) {
    logger.info(
      { user: req.user?.id },
      "Get user subscriptions request received"
    );
    try {
      const userId = req.user?.id;
      const subscriptions =
        await userSubscriptionService.getUserSubscriptions(userId || "");
      logger.info({ subscriptions }, "User subscriptions fetched successfully");
      res.send(subscriptions);
    } catch (err) {
      logger.error({ err }, "Failed to get user subscriptions");
      res.status(500).send({ error: "Failed to get user subscriptions" });
    }
  }
}
