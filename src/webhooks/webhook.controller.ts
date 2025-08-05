// Webhook Controller
// Ingests and deduplicates all incoming webhooks from external services
import { FastifyRequest, FastifyReply } from "fastify";
import { WebhookService } from "./webhook.service";

const webhookService = new WebhookService();

export async function webhookHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const event = request.body as any;
    const eventId =
      (event as any)?.id || (event as any)?.event_id || (event as any)?.uuid;
    if (!eventId) {
      reply.status(400).send({ error: "Missing event ID" });
      return;
    }
    const isDup = await webhookService.isDuplicate(eventId);
    if (!isDup) {
      await webhookService.markProcessed(eventId);
      await webhookService.queueEvent(event);
    }
    reply.send({ status: "ok" });
  } catch (err) {
    // Log error
    console.error("Webhook ingestion error:", err);
    reply.status(500).send({ error: "Internal server error" });
  }
}
