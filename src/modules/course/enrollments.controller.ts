import { FastifyRequest, FastifyReply } from "fastify";
import { EnrollmentService } from "../enrollments/enrollment.service";
import { logger } from "../../utils/Logger";
import { publishToQueue } from "../../utils/rabbitmqClient";

const enrollmentService = new EnrollmentService();

export const enrollInCourseController = async (
  req: FastifyRequest,
  res: FastifyReply
) => {
  try {
    const userId = (req as any).user?.id;
    const courseId = (req.params as any).courseId;
    logger.info({ userId, courseId }, "Enroll in course request received");
    if (!userId || !courseId) {
      return res.status(400).send({ error: "Missing user or course ID" });
    }
    const enrollment = await enrollmentService.enroll(userId, courseId);
    logger.info({ enrollment }, "User enrolled successfully");
    await publishToQueue("enrollment_events", {
      type: "enrolled",
      userId,
      courseId,
    });
    logger.info(
      { queue: "enrollment_events", userId, courseId },
      "Enrollment event pushed to RabbitMQ"
    );
    res.send(enrollment);
  } catch (err) {
    logger.error({ err }, "Failed to enroll in course");
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .send({ error: "Failed to enroll in course", details: message });
  }
};
