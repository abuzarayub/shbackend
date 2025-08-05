// Enrollment Controller
// Handles enrollment management endpoints
import { EnrollmentService } from "./enrollment.service";
import { logger, getRequestLogger } from "../../utils/Logger";
import { publishToQueue } from "../../utils/rabbitmqClient";
import { FastifyRequest, FastifyReply } from "fastify";
import { db, enrollments } from "../../db/Drizzle.config";

const enrollmentService = new EnrollmentService();

export class EnrollmentController {
  // Enroll user endpoint
  async enroll(req: FastifyRequest, res: FastifyReply) {
    const reqLogger = getRequestLogger({
      requestId: (req as any).id,
      userId: (req as any).user?.id,
    });
    reqLogger.info(
      { user: (req as any).user?.id, body: req.body },
      "Enroll request received"
    );
    try {
      const userId = (req as any).user?.id || (req.body as any).user_id;
      const courseId = (req.body as any).course_id; // Changed from product_id to course_id

      // Warning for missing or invalid data
      if (!userId || !courseId) {
        reqLogger.warn(
          { userId, courseId },
          "Enrollment attempt with missing user or course ID"
        );
      }

      const enrollment = await enrollmentService.enroll(userId, courseId);
      reqLogger.info({ enrollment }, "User enrolled successfully");
      await publishToQueue("enrollment_events", {
        type: "enrolled",
        userId,
        courseId, // Changed from productId to courseId
      });
      reqLogger.info(
        { queue: "enrollment_events", userId, courseId },
        "Enrollment event pushed to RabbitMQ"
      );
      res.send(enrollment);
    } catch (err) {
      reqLogger.error({ err }, "Failed to enroll user");
      const message = err instanceof Error ? err.message : String(err);
      console.error("Enroll error:", err); // Log the error for debugging
      res.status(500).send({ error: "Failed to enroll", details: message });
    }
  }

  // Get enrollment status endpoint
  async getEnrollment(req: FastifyRequest, res: FastifyReply) {
    const reqLogger = getRequestLogger({
      requestId: (req as any).id,
      userId: (req as any).user?.id,
    });
    reqLogger.info(
      { user: (req as any).user?.id, query: req.query },
      "Get enrollment request received"
    );
    try {
      const userId = (req as any).user?.id || (req.query as any).user_id;
      const courseId = (req.query as any).course_id; // Changed from product_id to course_id
      const enrollment = await enrollmentService.getEnrollment(
        userId,
        courseId
      );
      reqLogger.info({ enrollment }, "Enrollment fetched successfully");
      res.send(enrollment);
    } catch (err) {
      reqLogger.error({ err }, "Failed to get enrollment");
      const message = err instanceof Error ? err.message : String(err);
      res
        .status(500)
        .send({ error: "Failed to get enrollment", details: message });
    }
  }

  // Get all user enrollments endpoint
  async getUserEnrollments(req: FastifyRequest, res: FastifyReply) {
    const reqLogger = getRequestLogger({
      requestId: (req as any).id,
      userId: (req as any).user?.id,
    });
    reqLogger.info(
      { user: (req as any).user?.id },
      "Get user enrollments request received"
    );
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).send({ error: "User not authenticated" });
      }

      const userEnrollments =
        await enrollmentService.getUserEnrollments(userId);
      reqLogger.info(
        { count: userEnrollments.length },
        "User enrollments fetched successfully"
      );
      res.send(userEnrollments);
    } catch (err) {
      reqLogger.error({ err }, "Failed to get user enrollments");
      const message = err instanceof Error ? err.message : String(err);
      res
        .status(500)
        .send({ error: "Failed to get user enrollments", details: message });
    }
  }

  // TEMPORARY: Debug endpoint to get all enrollments
  async getAllEnrollments(req: FastifyRequest, res: FastifyReply) {
    const reqLogger = getRequestLogger({
      requestId: (req as any).id,
      userId: (req as any).user?.id,
    });
    reqLogger.info("Get all enrollments debug request received");

    try {
      // Get all enrollments from the database
      const allEnrollments = await db.select().from(enrollments);

      reqLogger.info(
        { count: allEnrollments.length },
        "All enrollments fetched successfully"
      );
      res.send(allEnrollments);
    } catch (err) {
      reqLogger.error({ err }, "Failed to get all enrollments");
      const message = err instanceof Error ? err.message : String(err);
      res
        .status(500)
        .send({ error: "Failed to get all enrollments", details: message });
    }
  }
}
