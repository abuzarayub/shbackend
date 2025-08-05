// Webhook Job Processor
// Consumes jobs from the webhook_processing_queue and updates business tables
import { consumeQueue, publishToQueue } from "../utils/rabbitmqClient";

export class WebhookJobProcessor {
  // Start consuming jobs from RabbitMQ
  async start() {
    await consumeQueue("webhook_processing_queue", this.processJob.bind(this));
  }

  // Upsert data into business tables and trigger further actions
  async processJob(job: any) {
    try {
      // TODO: Upsert logic for enrollments, transactions, etc.
      // Example: await upsertEnrollment(job);
      // After upsert, trigger further actions if needed
      // await publishToQueue('notification_queue', { ... });
    } catch (err) {
      // Log error
      console.error("Webhook job processing error:", err);
      // Optionally: publish to error queue or log
    }
  }
}
