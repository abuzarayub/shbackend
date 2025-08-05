/**
 * School service: handles CRUD operations for schools.
 */
import { getSupabaseAdminClient } from "../../utils/SupaBase";
import { logger } from "../../utils/Logger";

export class SchoolService {
  /**
   * Create a new school.
   */
  static async createSchool(name: string) {
    const supabase = await getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("schools")
      .insert({ name })
      .select()
      .single();
    if (error) {
      logger.error({ error }, "Failed to create school");
      throw new Error("Failed to create school");
    }
    return data;
  }

  /**
   * Get a school by ID.
   */
  static async getSchool(id: string) {
    const supabase = await getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      logger.warn({ id }, "School not found");
      throw new Error("School not found");
    }
    return data;
  }

  /**
   * Update a school by ID.
   */
  static async updateSchool(id: string, updates: { name?: string }) {
    const supabase = await getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("schools")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      logger.error({ id, error }, "Failed to update school");
      throw new Error("Failed to update school");
    }
    return data;
  }

  /**
   * Delete a school by ID.
   */
  static async deleteSchool(id: string) {
    const supabase = await getSupabaseAdminClient();
    const { error } = await supabase.from("schools").delete().eq("id", id);
    if (error) {
      logger.error({ id, error }, "Failed to delete school");
      throw new Error("Failed to delete school");
    }
    return { success: true };
  }

  /**
   * List all schools.
   */
  static async listSchools() {
    const supabase = await getSupabaseAdminClient();
    const { data, error } = await supabase.from("schools").select("*");
    if (error) {
      logger.error({ error }, "Failed to list schools");
      throw new Error("Failed to list schools");
    }
    return data;
  }
}
