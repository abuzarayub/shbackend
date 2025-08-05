// Webhook Service
// Handles deduplication and queueing of webhook events
import { publishToQueue } from "../utils/rabbitmqClient";
import { redis } from "../utils/redisClient";

export class WebhookService {
  // Deduplicate using Redis as a fast cache (simulate processed_events table)
  async isDuplicate(eventId: string): Promise<boolean> {
    const exists = await redis.get(`processed_event:${eventId}`);
    return !!exists;
  }

  // Mark event as processed in Redis (simulate DB insert)
  async markProcessed(eventId: string) {
    await redis.set(`processed_event:${eventId}`, "1", "EX", 60 * 60 * 24 * 7); // 7 days
  }

  // Add event to RabbitMQ queue
  async queueEvent(event: any): Promise<void> {
    await publishToQueue("webhook_processing_queue", event);
  }
}
