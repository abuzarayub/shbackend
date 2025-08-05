/**
 * Redis utility module for connection, health check, and shared Redis instance.
 * Also provides helpers for user profile caching, JWT blacklist, and error log list.
 */
import Redis from "ioredis";
import { logger } from "../utils/Logger";
import { config } from "../config";

// Use config.REDIS_URL if available, fallback to process.env.REDIS_URL
const redisUrl = config?.REDIS_URL || process.env.REDIS_URL!;

/**
 * Shared Redis client instance for the app.
 * Handles connection and error events for observability.
 */
export const redis = new Redis(redisUrl);

redis.on("connect", () => {
  logger.info("🟢 Redis connected successfully.");
});

redis.on("error", (err) => {
  logger.error("🔴 Redis connection error:", err);
});

/**
 * Health check utility for Redis.
 * @returns {Promise<boolean>} True if Redis is healthy, false otherwise.
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (err) {
    logger.error("Redis health check failed:", err);
    return false;
  }
}

/**
 * Generic cache get/set utility for common patterns.
 * @param {string} key - Redis key
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} Cached or fetched value
 */
export async function getOrSetCache(
  key: string,
  fetchFn: () => Promise<any>,
  ttl = 3600
) {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
    const value = await fetchFn();
    await redis.set(key, JSON.stringify(value), "EX", ttl);
    return value;
  } catch (err) {
    logger.error("getOrSetCache error:", err);
    // Fallback: just fetch if Redis fails
    return fetchFn();
  }
}

/**
 * User profile caching helpers
 */
export async function cacheUserProfile(
  userId: string,
  profile: any,
  ttl = 300
) {
  try {
    await redis.set(
      `user:profile:${userId}`,
      JSON.stringify(profile),
      "EX",
      ttl
    );
  } catch (err) {
    logger.error("cacheUserProfile error:", err);
  }
}
export async function getCachedUserProfile(userId: string) {
  try {
    const cached = await redis.get(`user:profile:${userId}`);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    logger.error("getCachedUserProfile error:", err);
    return null;
  }
}

/**
 * JWT blacklist helpers (for logout/invalidation)
 */
export async function blacklistJWT(token: string, ttl: number) {
  try {
    await redis.set(`jwt:blacklist:${token}`, "1", "EX", ttl);
  } catch (err) {
    logger.error("blacklistJWT error:", err);
  }
}
export async function isJWTBlacklisted(token: string) {
  try {
    return !!(await redis.get(`jwt:blacklist:${token}`));
  } catch (err) {
    logger.error("isJWTBlacklisted error:", err);
    return false;
  }
}

/**
 * Error log list (for real-time monitoring)
 */
export async function pushErrorLog(error: any) {
  try {
    await redis.lpush("error:logs", JSON.stringify(error));
    await redis.ltrim("error:logs", 0, 99); // Keep only the latest 100 errors
  } catch (err) {
    logger.error("pushErrorLog error:", err);
  }
}
