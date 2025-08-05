// Enrollment Service
// Handles enrollment management business logic
import { setCache, getCache } from "../../utils/redisClient";
import { publishToQueue } from "../../utils/rabbitmqClient";
import { db, enrollments } from "../../db/Drizzle.config";
import { eq } from "drizzle-orm";

export class EnrollmentService {
  // Enroll user in course, cache status, and publish event
  async enroll(userId: string, courseId: string) {
    // Insert enrollment in DB
    const [enrollment] = await db
      .insert(enrollments)
      .values({
        user_id: userId,
        course_id: courseId, // Changed from product_id to course_id
        status: "ENROLLED",
        enrolled_at: new Date().toISOString(),
      })
      .returning();

    const cacheKey = `enrollment:${userId}:${courseId}`;
    await setCache(cacheKey, enrollment, 3600);

    // Publish event
    await publishToQueue("enrollment_events", {
      type: "enrolled",
      userId,
      courseId, // Changed from productId to courseId
    });

    return enrollment;
  }

  // Get enrollment status, using Redis cache
  async getEnrollment(userId: string, courseId: string) {
    const cacheKey = `enrollment:${userId}:${courseId}`;
    let enrollment = await getCache(cacheKey);

    if (!enrollment) {
      // Fetch from DB
      [enrollment] = await db
        .select()
        .from(enrollments)
        .where(
          eq(enrollments.user_id, userId) && eq(enrollments.course_id, courseId) // Changed from product_id to course_id
        );

      if (enrollment) {
        await setCache(cacheKey, enrollment, 3600);
      }
    }

    return enrollment;
  }

  // Get all enrollments for a user
  async getUserEnrollments(userId: string) {
    console.log("🔍 getUserEnrollments called with userId:", userId);

    const cacheKey = `user_enrollments:${userId}`;
    let userEnrollments = await getCache(cacheKey);

    if (!userEnrollments) {
      console.log("🔍 No cache found, fetching from database...");

      // Fetch from DB
      try {
        userEnrollments = await db
          .select()
          .from(enrollments)
          .where(eq(enrollments.user_id, userId));

        console.log("🔍 Database query result:", userEnrollments);
        console.log(
          "🔍 Number of enrollments found:",
          userEnrollments?.length || 0
        );

        if (userEnrollments && userEnrollments.length > 0) {
          await setCache(cacheKey, userEnrollments, 1800); // Cache for 30 minutes
          console.log("🔍 Cached enrollments for user:", userId);
        }
      } catch (error) {
        console.error("🔍 Database query error:", error);
        userEnrollments = [];
      }
    } else {
      console.log("🔍 Found cached enrollments:", userEnrollments.length);
    }

    console.log("🔍 Returning enrollments:", userEnrollments || []);
    return userEnrollments || [];
  }
}
