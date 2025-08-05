// Redis Client Utility
// Handles connection, caching, rate limiting, and health checks
import Redis from "ioredis";
import { config } from "../config";

// Use config.REDIS_URL if available, fallback to process.env.REDIS_URL
const redisUrl = config?.REDIS_URL || process.env.REDIS_URL!;

// Export the same Redis instance as src/utils/redis.ts if possible for consistency
export const redis = new (require("ioredis"))(redisUrl);

/**
 * Health check utility for Redis.
 * @returns {Promise<boolean>} True if Redis is healthy, false otherwise.
 */
export async function redisHealthCheck() {
  try {
    await redis.ping();
    return true;
  } catch (err) {
    console.error("Redis health check failed:", err);
    return false;
  }
}

/**
 * Set a value in Redis cache with TTL.
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds
 */
export async function setCache(key: string, value: any, ttlSeconds = 3600) {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error("setCache error:", err);
  }
}

/**
 * Get a value from Redis cache.
 * @param {string} key
 * @returns {Promise<any>}
 */
export async function getCache(key: string) {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("getCache error:", err);
    return null;
  }
}

/**
 * Simple rate limiter using Redis INCR and EXPIRE.
 * @param {string} key
 * @param {number} limit
 * @param {number} windowSeconds
 * @returns {Promise<boolean>} True if over limit, false otherwise.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
) {
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    return current > limit;
  } catch (err) {
    console.error("rateLimit error:", err);
    return false;
  }
}
