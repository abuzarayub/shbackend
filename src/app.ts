/**
 * Main Fastify application entry point.
 *
 * Features:
 * - Modular route registration
 * - Global error handling
 * - Security headers (helmet)
 * - CORS
 * - Redis health check and caching
 * - Rate limiting middleware
 * - RabbitMQ health check
 * - Environment/config management
 * - Production-ready structure
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import dotenv from "dotenv";
import { logger } from "./utils/Logger";
import { authRoutes } from "./modules/auth/Auth.Route";
import { config } from "./utils/config";
import { checkRedisHealth } from "./utils/redis";
import { globalErrorHandler } from "./middleware/ErrorHandler";
import { rateLimit } from "./middleware/rateLimit";
import { initRabbitMQ, channel } from "./utils/rabbitmq";
import { redisHealthCheck } from "./utils/redisClient";
import { rabbitMQHealthCheck } from "./utils/rabbitmqClient";

// 📦 All route imports
import { courseRoutes } from "./modules/course/course.Route";
import { schoolRoutes } from "./modules/school/school.Route";
// import { lessonRoutes } from "./modules/lesson/Lesson.Route"; // ⏳ Coming soon

// Import all new route modules
import { enrollmentRoutes } from "./modules/enrollments/enrollment.route";
import { progressRoutes } from "./modules/progress/progress.route";
import { transactionRoutes } from "./modules/financials/transaction.route";
import { userSubscriptionRoutes } from "./modules/financials/userSubscription.route";
import { couponRoutes } from "./modules/financials/coupon.route";
import { payoutRoutes } from "./modules/financials/payout.route";
import { reviewRoutes } from "./modules/community/review.route";
import { communityPostRoutes } from "./modules/community/communityPost.route";
import { spaceMemberRoutes } from "./modules/community/spaceMember.route";
import { teamPlanRoutes } from "./modules/team-plans/teamPlan.route";
import { teamPlanMemberRoutes } from "./modules/team-plans/teamPlanMember.route";
import { notificationRoutes } from "./modules/notifications/notification.route";
import { actionLogRoutes } from "./modules/logs/actionLog.route";
import { applicationErrorRoutes } from "./modules/logs/applicationError.route";
import { platformSettingsRoutes } from "./modules/settings/platformSettings.route";
import { userRoutes } from "./modules/users/user.route";
import { adminRoutes } from "./modules/admin/admin.routes";
import { productsRoutes } from "./modules/products/products.route";

// 🌱 Load environment variables
dotenv.config();

// ============================
// RabbitMQ Consumers
// ============================
// Load background consumers (e.g., course_created_queue)
import "./Jobs/queue.processor";

// ============================
// App Initialization
// ============================
export const app = Fastify({
  logger: false,
});

// ============================
// Middleware Registration
// ============================
app.register(cors, {
  origin: true, // Allow all origins for testing
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
});
app.register(helmet);

// Apply rate limiting globally
app.addHook("onRequest", rateLimit);

// ============================
// Health Check Endpoint
// ============================
app.get("/health", async (req, reply) => {
  try {
    const redisOk = await redisHealthCheck();
    const rabbitOk = await rabbitMQHealthCheck();
    // TODO: Add DB health check (simulate as true for now)
    const dbOk = true;
    reply.send({
      status: redisOk && rabbitOk && dbOk ? "ok" : "degraded",
      redis: redisOk,
      rabbitmq: rabbitOk,
      db: dbOk,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    reply.status(500).send({ status: "error", error: message });
  }
});

// ============================
// Route Registration
// ============================
app.register(authRoutes, { prefix: "/api/auth" });
app.register(userRoutes, { prefix: "/api/client" });
app.register(enrollmentRoutes, { prefix: "/api/client" });
app.register(progressRoutes, { prefix: "/api/client" });
app.register(transactionRoutes, { prefix: "/api/client" });
app.register(userSubscriptionRoutes, { prefix: "/api/client" });
app.register(couponRoutes, { prefix: "/api/client" });
app.register(payoutRoutes, { prefix: "/api/client" });
app.register(reviewRoutes, { prefix: "/api/client" });
app.register(communityPostRoutes, { prefix: "/api/client" });
app.register(spaceMemberRoutes, { prefix: "/api/client" });
app.register(teamPlanRoutes, { prefix: "/api/client" });
app.register(teamPlanMemberRoutes, { prefix: "/api/client" });
app.register(notificationRoutes, { prefix: "/api/client" });
app.register(actionLogRoutes, { prefix: "/api/admin" });
app.register(applicationErrorRoutes, { prefix: "/api/admin" });
app.register(platformSettingsRoutes, { prefix: "/api/admin" });
app.register(adminRoutes, { prefix: "/api/admin" });

// Register course and school routes
app.register(courseRoutes, { prefix: "/api/courses" });
app.register(schoolRoutes, { prefix: "/api/schools" });

// Register products routes
app.register(productsRoutes, { prefix: "/api/products" });

// Add test route to verify Fastify route registration
app.get("/api/client/test", (req, res) => res.send({ ok: true }));

// Register LearnWorlds webhook endpoint
// app.post("/api/webhooks/learnworlds", learnworldsWebhookHandler);

// Webhooks (no prefix)
// app.post("/api/webhooks/learnworlds", learnworldsWebhookHandler);

// ============================
// Global Error Handler
// ============================
app.setErrorHandler(globalErrorHandler);

// ============================
// Server Startup
// ============================
const startServer = async () => {
  try {
    // Ensure RabbitMQ is initialized before starting the server
    await initRabbitMQ();
    logger.info("✅ RabbitMQ initialized");

    const PORT = Number(config.PORT) || 3000;
    await app.listen({ port: PORT, host: "0.0.0.0" });
    logger.info(`✅ Server running on http://localhost:${PORT}`);
  } catch (err) {
    logger.error("❌ Failed to start server:", err);
    console.error(err); // Print full error and stack trace
    process.exit(1);
  }
};

startServer();
