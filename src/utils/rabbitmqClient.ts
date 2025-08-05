// RabbitMQ Client Utility
// Handles connection, publishing, consuming, and health checks
import amqp from "amqplib";
import { config } from "../config";

let connection: any = null;
let channel: any = null;

export async function connectRabbitMQ() {
  if (!config.RABBITMQ_URL) {
    throw new Error("RABBITMQ_URL is not configured");
  }
  connection = await amqp.connect(config.RABBITMQ_URL);
  if (!connection) {
    throw new Error("Failed to connect to RabbitMQ");
  }
  channel = await connection.createChannel();
}

export async function publishToQueue(queue: string, message: any) {
  if (!channel) await connectRabbitMQ();
  if (!channel) throw new Error("Failed to create RabbitMQ channel");
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
}

export async function consumeQueue(
  queue: string,
  handler: (msg: any) => Promise<void>
) {
  if (!channel) await connectRabbitMQ();
  if (!channel) throw new Error("Failed to create RabbitMQ channel");
  await channel.assertQueue(queue, { durable: true });
  channel.consume(queue, async (msg: any) => {
    if (msg && channel) {
      await handler(JSON.parse(msg.content.toString()));
      channel.ack(msg);
    }
  });
}

export async function rabbitMQHealthCheck() {
  try {
    if (!connection) await connectRabbitMQ();
    if (!channel) throw new Error("Failed to create RabbitMQ channel");
    await channel.assertQueue("health_check");
    return true;
  } catch (err) {
    return false;
  }
}
