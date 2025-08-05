/**
 * Publishes a message to a RabbitMQ queue using the shared channel.
 * Uses the professional logger for all logs and errors.
 */
import { channel } from "./rabbitmq";
import { logger } from "./Logger";

export const publishToQueue = async (queue: string, payload: any) => {
  try {
    await channel.assertQueue(queue, { durable: true });
    logger.info(
      { queue, payload },
      `📤 Publishing to RabbitMQ queue "${queue}"`
    );
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
    });
  } catch (error) {
    logger.error({ queue, error }, `❌ Failed to publish to ${queue}`);
  }
};
