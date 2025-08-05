import {
  getSupabaseClient,
  getSupabaseAdminClient,
} from "../../utils/SupaBase";
import { CreateCourseInput } from "../../types/course/types";
import { redis } from "../../utils/redis";
import { logger } from "../../utils/Logger";

// Manual definition matching your Supabase courses table
export interface CourseRow {
  id: string;
  instructor_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  price: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export class CourseService {
  /**
   * Inserts a new course for the given instructor
   */
  static async createCourse(
    input: CreateCourseInput,
    instructorId: string,
    userAccessToken: string
  ): Promise<CourseRow> {
    const supabase = await getSupabaseClient(userAccessToken); // ✅ Awaited

    const {
      title,
      description,
      thumbnail_url,
      price,
      is_published = false,
    } = input;

    const { data, error } = await supabase
      .from("courses")
      .insert({
        instructor_id: instructorId,
        title,
        description,
        thumbnail_url,
        price,
        is_published,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create course: ${error.message}`);
    }

    // Invalidate published courses cache
    await redis.del("courses:published");

    return data as CourseRow;
  }

  /**
   * Fetch all published courses (with Redis caching)
   */
  static async getAllPublishedCourses(
    userAccessToken: string
  ): Promise<CourseRow[]> {
    const cacheKey = "courses:published";
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const supabase = await getSupabaseClient(userAccessToken); // ✅ Awaited

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }

    // Cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(data), "EX", 300);
    return data as CourseRow[];
  }

  static async assignInstructor(courseId: string, instructorId: string) {
    const supabase = await getSupabaseAdminClient();
    const { error } = await supabase
      .from("course_instructors")
      .insert({ course_id: courseId, instructor_id: instructorId });
    if (error) {
      logger.error(
        { courseId, instructorId, error },
        "Failed to assign instructor"
      );
      throw new Error("Failed to assign instructor");
    }
    return { success: true };
  }

  static async unassignInstructor(courseId: string, instructorId: string) {
    const supabase = await getSupabaseAdminClient();
    const { error } = await supabase
      .from("course_instructors")
      .delete()
      .eq("course_id", courseId)
      .eq("instructor_id", instructorId);
    if (error) {
      logger.error(
        { courseId, instructorId, error },
        "Failed to unassign instructor"
      );
      throw new Error("Failed to unassign instructor");
    }
    return { success: true };
  }

  static async listInstructors(courseId: string) {
    const supabase = await getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("course_instructors")
      .select("instructor_id")
      .eq("course_id", courseId);
    if (error) {
      logger.error({ courseId, error }, "Failed to list instructors");
      throw new Error("Failed to list instructors");
    }
    return data;
  }

  static async attachBundle(courseId: string, bundleId: string) {
    const supabase = await getSupabaseAdminClient();
    const { error } = await supabase
      .from("course_bundles")
      .insert({ course_id: courseId, bundle_id: bundleId });
    if (error) {
      logger.error({ courseId, bundleId, error }, "Failed to attach bundle");
      throw new Error("Failed to attach bundle");
    }
    return { success: true };
  }

  static async detachBundle(courseId: string, bundleId: string) {
    const supabase = await getSupabaseAdminClient();
    const { error } = await supabase
      .from("course_bundles")
      .delete()
      .eq("course_id", courseId)
      .eq("bundle_id", bundleId);
    if (error) {
      logger.error({ courseId, bundleId, error }, "Failed to detach bundle");
      throw new Error("Failed to detach bundle");
    }
    return { success: true };
  }

  static async listBundles(courseId: string) {
    const supabase = await getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("course_bundles")
      .select("bundle_id")
      .eq("course_id", courseId);
    if (error) {
      logger.error({ courseId, error }, "Failed to list bundles");
      throw new Error("Failed to list bundles");
    }
    return data;
  }

  // Future:
  // - getCoursesByInstructor
  // - updateCourse
  // - deleteCourse
  // - getCourseById
}
