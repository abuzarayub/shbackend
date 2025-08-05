import { eq } from "drizzle-orm";
import { setCache, getCache } from "../../utils/redisClient";
import {
  db,
  user_subscriptions as userSubscriptionsTable,
} from "../../db/Drizzle.config";

export class UserSubscriptionService {
  async createUserSubscription(userId: string, data: any) {
    const { status, started_at, ended_at } = data;
    const [subscription] = await db
      .insert(userSubscriptionsTable)
      .values({
        user_id: userId,
        status: status || "ACTIVE",
        started_at: started_at || new Date().toISOString(),
        ended_at: ended_at || null,
      })
      .returning();

    const cacheKey = `user_subscriptions:${userId}`;
    await setCache(cacheKey, null, 0);
    return subscription;
  }

  async getUserSubscriptions(userId: string) {
    const cacheKey = `user_subscriptions:${userId}`;
    let subscriptions = await getCache(cacheKey);
    if (!subscriptions) {
      subscriptions = await db
        .select()
        .from(userSubscriptionsTable)
        .where(eq(userSubscriptionsTable.user_id, userId)); // ✅ fixed here

      await setCache(cacheKey, subscriptions, 3600);
    }
    return subscriptions;
  }
}
