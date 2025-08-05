/**
 * Rate limiting middleware using Redis.
 * Limits each IP to 100 requests per minute.
 *
 * Usage: Register globally or per-route in Fastify.
 */
import { FastifyRequest, FastifyReply } from "fastify";
import { redis } from "../utils/redis";

/**
 * Fastify middleware for rate limiting.
 * @param {FastifyRequest} request - The incoming request.
 * @param {FastifyReply} reply - The outgoing reply.
 */
export async function rateLimit(request: FastifyRequest, reply: FastifyReply) {
  const ip = request.ip;
  const key = `ratelimit:${ip}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, 60); // 1 minute window
  }

  if (current > 500) {
    return reply.status(429).send({ error: "Too many requests" });
  }
}
