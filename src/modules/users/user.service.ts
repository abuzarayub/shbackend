// User Service
// Handles user management business logic
import { setCache, getCache } from "../../utils/redisClient";
import { publishToQueue } from "../../utils/rabbitmqClient";
import { db } from "../../db/Drizzle.config";
import { platformUsers } from "../../db/platform_users";
import { eq } from "drizzle-orm";

export class UserService {
  // Get user profile, using Redis cache
  async getProfile(userId: string) {
    const cacheKey = `user:profile:${userId}`;
    let profile = await getCache(cacheKey);
    if (!profile) {
      // Fetch from DB
      const [user] = await db
        .select({
          id: platformUsers.id,
          email: platformUsers.email,
          fullName: platformUsers.fullName,
          avatarUrl: platformUsers.avatarUrl,
          role: platformUsers.role,
          learnworldsUser_: platformUsers.learnworldsUser_,
          isActive: platformUsers.isActive,
          createdAt: platformUsers.createdAt,
          updatedAt: platformUsers.updatedAt,
          school_id: platformUsers.school_id,
        })
        .from(platformUsers)
        .where(eq(platformUsers.id, userId));
      if (!user) throw new Error("User not found");
      profile = user;
      await setCache(cacheKey, profile, 3600);
    }
    return profile;
  }

  // Update user profile and publish event to RabbitMQ
  async updateProfile(userId: string, data: any) {
    // TODO: Update in DB
    // await db.updateUserProfile(userId, data);
    // Invalidate cache
    const cacheKey = `user:profile:${userId}`;
    await setCache(cacheKey, data, 3600);
    // Publish event
    await publishToQueue("user_events", {
      type: "profile_updated",
      userId,
      data,
    });
  }
}
