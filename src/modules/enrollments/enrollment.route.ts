// Enrollment Routes
// Registers enrollment management endpoints
import { FastifyInstance } from "fastify";
import { EnrollmentController } from "./enrollment.controller";
import { authenticate } from "../../middleware/autheticate";

export async function enrollmentRoutes(app: FastifyInstance) {
  const controller = new EnrollmentController();

  // Apply authentication to all enrollment routes
  app.addHook("preHandler", authenticate);

  // Enroll user
  app.post("/enrollments", controller.enroll);
  // Get enrollment status
  app.get("/enrollments", controller.getEnrollment);
  // Get all user enrollments
  app.get("/enrollments/all", controller.getUserEnrollments);

  // TEMPORARY: Debug endpoint to get all enrollments
  app.get("/enrollments/debug/all", controller.getAllEnrollments);
}
