/**
 * RabbitMQ connection utility.
 * Handles connection and channel creation, and logs all events.
 *
 * Exports:
 * - initRabbitMQ: Initializes and returns the connection and channel
 * - getRabbitChannel: Returns the channel if initialized, throws otherwise
 * - connection, channel: The shared connection and channel (if needed)
 */
import amqp, { Connection, Channel } from "amqplib";
import { logger } from "../utils/Logger";

const rabbitUrl = process.env.RABBITMQ_URL!;

let connection: any;
let channel: any;

export const initRabbitMQ = async (): Promise<{
  connection: Connection;
  channel: Channel;
}> => {
  try {
    connection = await amqp.connect(rabbitUrl);
    logger.info("✅ Connected to RabbitMQ");

    channel = await connection.createChannel();
    logger.info("✅ Channel created");

    return { connection, channel };
  } catch (error) {
    logger.error({ error }, "❌ RabbitMQ connection failed");
    process.exit(1);
  }
};

/**
 * Returns the RabbitMQ channel if initialized, throws otherwise.
 */
export function getRabbitChannel(): Channel {
  if (!channel)
    throw new Error(
      "RabbitMQ channel not initialized. Call initRabbitMQ first."
    );
  return channel;
}

export { connection, channel };
