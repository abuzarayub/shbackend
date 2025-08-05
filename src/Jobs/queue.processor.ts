// src/jobs/queue.processor.ts

import { channel } from "../utils/rabbitmq";
import { logger } from "../utils/Logger";

// TODO: Implement or import these services when available
const syncCourseToLearnWorlds = async (courseData: any) => {
  logger.info("Mock syncCourseToLearnWorlds called with:", courseData);
  // Simulate async operation
  return Promise.resolve();
};

const indexCourseToSearch = async (courseData: any) => {
  logger.info("Mock indexCourseToSearch called with:", courseData);
  // Simulate async operation
  return Promise.resolve();
};

const logErrorToDB = async (queue: string, error: any) => {
  logger.error(`Mock logErrorToDB for queue ${queue}:`, error);
  // Simulate async operation
  return Promise.resolve();
};

// Queue name
const QUEUE_NAME = "course_created_queue";

export const consumeCourseCreatedQueue = async () => {
  try {
    if (!channel) throw new Error("RabbitMQ channel is not initialized");

    await channel.assertQueue(QUEUE_NAME, { durable: true });

    logger.info(`🎯 Waiting for messages in ${QUEUE_NAME}...`);

    channel.consume(QUEUE_NAME, async (msg: any) => {
      if (msg) {
        try {
          const courseData = JSON.parse(msg.content.toString());

          logger.info(`📩 Received course_created_queue:`, courseData);

          // 1. Sync with LearnWorlds
          await syncCourseToLearnWorlds(courseData);

          // 2. Sync with Typesense
          await indexCourseToSearch(courseData);

          // Acknowledge message (remove it from queue)
          channel.ack(msg);
        } catch (err) {
          logger.error("❌ Failed to process course_created_queue:", err);

          // Log error to DB for auditing
          await logErrorToDB("course_created_queue", err);

          // Don't ack, message will be retried or dead-lettered
        }
      }
    });
  } catch (err) {
    logger.error("❌ Consumer setup failed:", err);
  }
};
