// Notification Routes
// Registers notification endpoints
import { FastifyInstance } from "fastify";
import { NotificationController } from "./notification.controller";

export async function notificationRoutes(app: FastifyInstance) {
  const controller = new NotificationController();
  // List user notifications
  app.get("/api/client/notifications", controller.ListNotifications);
  // Mark notification as read
  app.patch("/api/client/notifications/:id/read", controller.MarkAsRead);
}
