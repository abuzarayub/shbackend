// User Subscription Routes
// Registers user subscription endpoints
import { FastifyInstance } from "fastify";
import { UserSubscriptionController } from "./userSubscription.controller";

export async function userSubscriptionRoutes(app: FastifyInstance) {
  const controller = new UserSubscriptionController();
  // Create a user subscription
  app.post("/api/client/user-subscriptions", controller.createUserSubscription);
  // Get user subscriptions
  app.get("/api/client/user-subscriptions", controller.getUserSubscriptions);
}
