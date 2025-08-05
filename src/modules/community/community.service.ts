// Community Service
// Handles community business logic
import { setCache, getCache } from "../../utils/redisClient";
import { publishToQueue } from "../../utils/rabbitmqClient";
import { db, collections as collectionsTable } from "../../db/Drizzle.config";

export class CommunityService {
  // Get collections, using Redis cache
  async getCollections() {
    const cacheKey = "community:collections";
    let collections = await getCache(cacheKey);
    if (!collections) {
      // Fetch from DB
      collections = await db.select().from(collectionsTable);
      await setCache(cacheKey, collections, 3600);
    }
    return collections;
  }

  // Add a new collection and publish event to RabbitMQ
  async addCollection(data: any) {
    // Insert collection in DB
    const [collection] = await db
      .insert(collectionsTable)
      .values({
        name: data.name,
      })
      .returning();
    // Invalidate cache
    const cacheKey = "community:collections";
    await setCache(cacheKey, null, 0);
    // Publish event
    await publishToQueue("community_events", {
      type: "collection_added",
      data,
    });
    return collection;
  }
}
