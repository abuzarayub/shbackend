// Progress Service
// Handles user progress business logic
import { setCache, getCache } from "../../utils/redisClient";
import { db, progress as progressTable } from "../../db/Drizzle.config";
import { eq } from "drizzle-orm";

export class ProgressService {
  // Get user progress for a product, using Redis cache
  async getProgress(userId: string, productId: string) {
    const cacheKey = `progress:${userId}:${productId}`;
    let progressRecord = await getCache(cacheKey);

    if (!progressRecord) {
      // Fetch from DB - try both product_id and course_id
      [progressRecord] = await db
        .select()
        .from(progressTable)
        .where(
          eq(progressTable.user_id, userId) &&
            (eq(progressTable.course_id, productId) ||
              eq(progressTable.course_id, productId))
        );

      if (progressRecord) {
        await setCache(cacheKey, progressRecord, 3600);
      }
    }

    // Transform the data to match expected format
    if (progressRecord) {
      return {
        completed_lessons: progressRecord.progress || 0,
        total_lessons: 10, // Default value, can be fetched from course details
        progress_percentage: progressRecord.progress || 0,
        last_activity: progressRecord.updated_at || new Date().toISOString(),
      };
    }

    return null;
  }

  // Update user progress for a product
  async updateProgress(userId: string, productId: string, data: any) {
    const { progress: progressValue } = data;

    // Try to update first
    const updated = await db
      .update(progressTable)
      .set({
        progress: String(progressValue),
        updated_at: new Date().toISOString(),
      })
      .where(
        eq(progressTable.user_id, userId) &&
          eq(progressTable.course_id, productId)
      )
      .returning();

    let progressRecord;
    if (updated.length > 0) {
      progressRecord = updated[0];
    } else {
      // Insert if not exists
      [progressRecord] = await db
        .insert(progressTable)
        .values({
          user_id: userId,
          course_id: productId,
          progress: String(progressValue),
          updated_at: new Date().toISOString(),
        })
        .returning();
    }

    const cacheKey = `progress:${userId}:${productId}`;
    await setCache(cacheKey, progressRecord, 3600);

    return {
      completed_lessons: progressRecord.progress || 0,
      total_lessons: 10,
      progress_percentage: progressRecord.progress || 0,
      last_activity: progressRecord.updated_at || new Date().toISOString(),
    };
  }
}
