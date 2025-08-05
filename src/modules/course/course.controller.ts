/**
 * Course controller: handles course creation, update, and related logic.
 */
import { FastifyRequest, FastifyReply } from "fastify";
import { createCourseSchema } from "./course.schema";
import { ZodError } from "zod";
import {
  getSupabaseClient,
  getSupabaseAdminClient,
} from "../../utils/SupaBase";
import { publishToQueue } from "../../utils/pusRabbimq";
import { logger } from "../../utils/Logger";
import { updateCourseSchema } from "./updateCourseZod";
import { redis } from "../../utils/redis";
import { CourseService } from "./course.service";

export const createCourseController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  console.log("CREATE COURSE CONTROLLER HIT");
  debugger; // Debugger for manual inspection
  try {
    // ✅ Validate input using Zod
    const parsed = createCourseSchema.parse({
      body: request.body,
    });

    // ✅ Ensure user is authenticated instructor
    const user = (request as any).user; // Type override if needed
    if (!user || user.role !== "instructor") {
      return reply
        .status(403)
        .send({ error: "Only instructors can create courses" });
    }
    if (!user.id) {
      return reply.status(400).send({ error: "Missing user id." });
    }

    // Log the instructor_id being used
    console.log("Instructor ID used for insert:", user.id);

    // Log all platform_users IDs for debugging
    try {
      const adminSupabase = getSupabaseAdminClient();
      const { data: allUsers, error: userFetchError } = await adminSupabase
        .from("platform_users")
        .select("id");
      if (userFetchError) {
        console.error("Error fetching platform_users:", userFetchError);
      } else {
        console.log(
          "All platform_users IDs:",
          allUsers?.map((u) => u.id)
        );
      }
    } catch (e) {
      console.error("Error logging platform_users IDs:", e);
    }

    // Get the user's JWT from the Authorization header
    const authHeader = request.headers.authorization;
    const userAccessToken = authHeader ? authHeader.replace("Bearer ", "") : "";
    const supabase = await getSupabaseClient(userAccessToken);

    const { title, description, thumbnail_url, price, is_published } =
      parsed.body;
    console.log("Debug values:", {
      title,
      description,
      thumbnail_url,
      price,
      is_published,
      userId: user.id,
    });

    const { data, error } = await supabase
      .from("courses")
      .insert([
        {
          instructor_id: user.id, // must be a valid UUID
          title,
          description,
          thumbnail_url,
          price, // must be a number
          is_published, // must be a boolean
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return reply
        .status(500)
        .send({ error: error.message || "Failed to create course" });
    }

    await publishToQueue("course_created_queue", {
      courseId: data.id,
      instructorId: user.id,
      title: data.title,
      description: data.description,
      createdAt: data.created_at,
    });

    return reply.status(201).send({
      message: "Course created successfully",
      course: data,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return reply.status(400).send({ error: err.issues[0].message });
    }
    console.error("Unexpected error:", err);
    return reply.status(500).send({ error: "Internal server error" });
  }
};

/**
 * PATCH /api/courses/:id
 * Updates a course if the authenticated instructor owns it.
 */
export const updateCourse = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    // ✅ Parse and validate request
    const { id } = request.params as { id: string };
    const data = updateCourseSchema.parse({
      body: request.body,
      params: request.params,
    });

    const user = (request as any).user;
    if (!user || user.role !== "instructor") {
      return reply
        .status(403)
        .send({ error: "Only instructors can update courses" });
    }
    if (!user.id) {
      return reply.status(400).send({ error: "Missing user id." });
    }

    // Get the user's JWT from the Authorization header
    const authHeader = request.headers.authorization;
    const userAccessToken = authHeader ? authHeader.replace("Bearer ", "") : "";
    const supabase = await getSupabaseClient(userAccessToken);

    // ✅ Step 1: Check if course exists and belongs to this instructor
    const { data: existingCourse, error: fetchError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .eq("instructor_id", user.id)
      .single();

    if (fetchError || !existingCourse) {
      logger.warn(
        { id, userId: user.id },
        "Course not found or not owned by instructor"
      );
      return reply.code(404).send({ message: "Course not found" });
    }

    // ✅ Step 2: Update course with only allowed fields
    const { error: updateError } = await supabase
      .from("courses")
      .update({ ...data.body })
      .eq("id", id);

    if (updateError) {
      logger.error({ id, updateError }, "Failed to update course");
      return reply.code(500).send({ message: "Failed to update course" });
    }

    // ✅ Step 3: Fetch updated course
    const { data: updatedCourse } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    // ✅ Step 4: Invalidate Redis course cache
    await redis.del("courses:published");

    // ✅ Step 5: Push to RabbitMQ for LearnWorlds Sync
    await publishToQueue("course_created_queue", {
      courseId: id,
      instructorId: user.id,
      ...updatedCourse,
    });

    // ✅ Step 6: Send response
    return reply.code(200).send({
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (err: any) {
    logger.error(err, "Update course failed");
    if (err instanceof ZodError) {
      return reply.status(400).send({ error: err.issues[0].message });
    }
    return reply.code(400).send({ message: err.message || "Invalid request" });
  }
};

/**
 * DELETE /api/courses/:id (soft delete/archive)
 * Only the instructor who owns the course or an admin can archive a course.
 */
export const archiveCourse = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as { id: string };
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: "Unauthorized" });

    // Get the user's JWT from the Authorization header
    const authHeader = request.headers.authorization;
    const userAccessToken = authHeader ? authHeader.replace("Bearer ", "") : "";
    const supabase = await getSupabaseClient(userAccessToken);

    // Check if course exists and is owned by instructor or user is admin
    const { data: course, error: fetchError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError || !course) {
      logger.warn({ id, userId: user.id }, "Course not found for archive");
      return reply.code(404).send({ message: "Course not found" });
    }
    if (user.role !== "admin" && course.instructor_id !== user.id) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    // Soft delete (archive)
    const { error: archiveError } = await supabase
      .from("courses")
      .update({ archived: true })
      .eq("id", id);
    if (archiveError) {
      logger.error({ id, archiveError }, "Failed to archive course");
      return reply.code(500).send({ message: "Failed to archive course" });
    }

    await redis.del("courses:published");
    await publishToQueue("course_created_queue", {
      courseId: id,
      action: "archived",
    });

    return reply.code(200).send({ message: "Course archived successfully" });
  } catch (err: any) {
    logger.error(err, "Archive course failed");
    return reply.code(400).send({ message: err.message || "Invalid request" });
  }
};

/**
 * GET /api/courses/:id
 * Fetch a single course by ID (with Redis caching).
 */
export const getSingleCourse = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as { id: string };
    const cacheKey = `course:single:${id}`;
    let course = await redis.get(cacheKey);
    if (course) {
      return reply.send(JSON.parse(course));
    }
    const supabase = await getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      logger.warn({ id }, "Course not found");
      return reply.code(404).send({ message: "Course not found" });
    }
    await redis.set(cacheKey, JSON.stringify(data), "EX", 300);
    return reply.send(data);
  } catch (err: any) {
    logger.error(err, "Get single course failed");
    return reply.code(400).send({ message: err.message || "Invalid request" });
  }
};

/**
 * POST /api/admin/courses/:id/actions/approve
 * Only admin can approve a course (status: approved)
 */
export const approveCourse = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as { id: string };
    const user = (request as any).user;
    if (!user || user.role !== "admin") {
      return reply
        .status(403)
        .send({ error: "Only admin can approve courses" });
    }
    const supabase = await getSupabaseAdminClient();
    const { error: updateError } = await supabase
      .from("courses")
      .update({ status: "approved" })
      .eq("id", id);
    if (updateError) {
      logger.error({ id, updateError }, "Failed to approve course");
      return reply.code(500).send({ message: "Failed to approve course" });
    }
    await redis.del("courses:published");
    await publishToQueue("course_created_queue", {
      courseId: id,
      action: "approved",
    });
    return reply.code(200).send({ message: "Course approved" });
  } catch (err: any) {
    logger.error(err, "Approve course failed");
    return reply.code(400).send({ message: err.message || "Invalid request" });
  }
};

/**
 * POST /api/admin/courses/:id/actions/reject
 * Only admin can reject a course (status: rejected)
 */
export const rejectCourse = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  debugger; // Debugger for manual inspection
  try {
    const { id } = request.params as { id: string };
    const user = (request as any).user;
    if (!user || user.role !== "admin") {
      return reply.status(403).send({ error: "Only admin can reject courses" });
    }
    const { reason } = request.body as { reason?: string };
    const supabase = await getSupabaseAdminClient();
    const { error: updateError } = await supabase
      .from("courses")
      .update({ status: "rejected", rejection_reason: reason || null })
      .eq("id", id);
    if (updateError) {
      console.error("Failed to reject course:", updateError); // Log the error for debugging
      return reply
        .code(500)
        .send({
          message: "Failed to reject course",
          details: updateError.message,
        });
    }
    await redis.del("courses:published");
    await publishToQueue("course_created_queue", {
      courseId: id,
      action: "rejected",
      reason,
    });
    return reply.code(200).send({ message: "Course rejected" });
  } catch (err: any) {
    logger.error(err, "Reject course failed");
    return reply.code(400).send({ message: err.message || "Invalid request" });
  }
};

/**
 * POST /api/courses/:id/instructors
 * Assign one or more instructors to a course.
 */
export const assignInstructorsController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as { id: string };
    const { instructorIds } = request.body as { instructorIds: string[] };
    if (!Array.isArray(instructorIds) || instructorIds.length === 0) {
      return reply
        .status(400)
        .send({ error: "instructorIds must be a non-empty array" });
    }
    for (const instructorId of instructorIds) {
      await CourseService.assignInstructor(id, instructorId);
    }
    return reply.send({ message: "Instructors assigned" });
  } catch (err: any) {
    logger.error(err, "Assign instructors failed");
    return reply.status(400).send({ error: err.message || "Invalid request" });
  }
};

/**
 * DELETE /api/courses/:id/instructors/:instructorId
 * Unassign an instructor from a course.
 */
export const unassignInstructorController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    // The error occurs because `unassignInstructor` is not defined on the CourseService class.
    // You need to implement the `unassignInstructor` method in CourseService (course.service.ts).
    // That's why TypeScript throws: "Property 'unassignInstructor' does not exist on type 'typeof CourseService'."
    // The controller code itself is correct, but the service method is missing.
    const { id, instructorId } = request.params as {
      id: string;
      instructorId: string;
    };
    // This will throw unless you add CourseService.unassignInstructor in course.service.ts
    await CourseService.unassignInstructor(id, instructorId);
    return reply.send({ message: "Instructor unassigned" });
  } catch (err: any) {
    logger.error(err, "Unassign instructor failed");
    return reply.status(400).send({ error: err.message || "Invalid request" });
  }
};

/**
 * GET /api/courses/:id/instructors
 * List all instructors for a course.
 */
export const listInstructorsController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as { id: string };
    const instructors = await CourseService.listInstructors(id);
    return reply.send(instructors);
  } catch (err: any) {
    logger.error(err, "List instructors failed");
    return reply.status(400).send({ error: err.message || "Invalid request" });
  }
};

/**
 * POST /api/courses/:id/bundles
 * Attach a course to one or more bundles.
 */
export const attachBundlesController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as { id: string };
    const { bundleIds } = request.body as { bundleIds: string[] };
    if (!Array.isArray(bundleIds) || bundleIds.length === 0) {
      return reply
        .status(400)
        .send({ error: "bundleIds must be a non-empty array" });
    }
    for (const bundleId of bundleIds) {
      await CourseService.attachBundle(id, bundleId);
    }
    return reply.send({ message: "Bundles attached" });
  } catch (err: any) {
    logger.error(err, "Attach bundles failed");
    return reply.status(400).send({ error: err.message || "Invalid request" });
  }
};

/**
 * DELETE /api/courses/:id/bundles/:bundleId
 * Detach a course from a bundle.
 */
export const detachBundleController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id, bundleId } = request.params as { id: string; bundleId: string };
    await CourseService.detachBundle(id, bundleId);
    return reply.send({ message: "Bundle detached" });
  } catch (err: any) {
    logger.error(err, "Detach bundle failed");
    return reply.status(400).send({ error: err.message || "Invalid request" });
  }
};

/**
 * GET /api/courses/:id/bundles
 * List all bundles for a course.
 */
export const listBundlesController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as { id: string };
    const bundles = await CourseService.listBundles(id);
    return reply.send(bundles);
  } catch (err: any) {
    logger.error(err, "List bundles failed");
    return reply.status(400).send({ error: err.message || "Invalid request" });
  }
};
