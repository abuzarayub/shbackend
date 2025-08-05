// src/modules/course/course.route.ts

import { FastifyInstance } from "fastify";
import { authenticate } from "../../middleware/autheticate";
import {
  createCourseController,
  updateCourse,
  archiveCourse,
  getSingleCourse,
  approveCourse,
  rejectCourse,
  assignInstructorsController,
  unassignInstructorController,
  listInstructorsController,
  attachBundlesController,
  detachBundleController,
  listBundlesController,
} from "./course.controller";
import { enrollInCourseController } from "./enrollments.controller";
import { getSupabaseClient } from "../../utils/SupaBase";

/**
 * Registers all course-related routes.
 * - POST   /api/courses         Create course
 * - PATCH  /api/courses/:id     Update course
 * - DELETE /api/courses/:id     Archive (soft delete) course
 * - GET    /api/courses/:id     Get single course
 * - GET    /api/courses         Get all courses (admin/instructor filtering)
 * - POST   /api/admin/courses/:id/actions/approve   Approve course (admin)
 * - POST   /api/admin/courses/:id/actions/reject    Reject course (admin)
 */
export async function courseRoutes(fastify: FastifyInstance) {
  // Create course
  fastify.post("/", { preHandler: [authenticate] }, createCourseController);

  // Update course
  fastify.patch("/:id", { preHandler: [authenticate] }, updateCourse);

  // Archive (soft delete) course
  fastify.delete("/:id", { preHandler: [authenticate] }, archiveCourse);

  // Get single course
  fastify.get("/:id", { preHandler: [authenticate] }, getSingleCourse);

  // Get all courses (admin/instructor filtering)
  fastify.get("/", { preHandler: [authenticate] }, async (request, reply) => {
    // TODO: Implement admin/instructor filtering in controller/service
    // Placeholder: return all published, non-archived courses
    // (You can move this logic to a controller for clarity)
    const user = (request as any).user;
    // Use direct import and proper file extension for NodeNext module resolution
    const supabase = await getSupabaseClient(
      request.headers.authorization?.replace("Bearer ", "") || ""
    );
    let query = supabase.from("courses").select("*").eq("archived", false);
    if (user.role === "instructor") {
      query = query.eq("instructor_id", user.id);
    }
    // Add admin filters here if needed (e.g., status, creator, etc.)
    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });

  // Admin: Approve course
  fastify.post(
    "/admin/courses/:id/actions/approve",
    { preHandler: [authenticate] },
    approveCourse
  );

  // Admin: Reject course
  fastify.post(
    "/admin/courses/:id/actions/reject",
    { preHandler: [authenticate] },
    rejectCourse
  );

  // Assign instructors to course
  fastify.post(
    "/:id/instructors",
    { preHandler: [authenticate] },
    assignInstructorsController
  );

  // Unassign instructor from course
  fastify.delete(
    "/:id/instructors/:instructorId",
    { preHandler: [authenticate] },
    unassignInstructorController
  );

  // List all instructors for a course
  fastify.get(
    "/:id/instructors",
    { preHandler: [authenticate] },
    listInstructorsController
  );

  // Attach bundles to course
  fastify.post(
    "/:id/bundles",
    { preHandler: [authenticate] },
    attachBundlesController
  );

  // Detach bundle from course
  fastify.delete(
    "/:id/bundles/:bundleId",
    { preHandler: [authenticate] },
    detachBundleController
  );

  // List all bundles for a course
  fastify.get(
    "/:id/bundles",
    { preHandler: [authenticate] },
    listBundlesController
  );

  // Enroll in a course
  fastify.post(
    "/:courseId/enroll",
    { preHandler: [authenticate] },
    enrollInCourseController
  );
}
