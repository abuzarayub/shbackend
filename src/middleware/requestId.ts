import { FastifyRequest, FastifyReply } from "fastify";
import { v4 as uuidv4 } from "uuid";

/**
 * Fastify middleware to ensure every request has a unique requestId.
 * - Checks for X-Request-Id header, otherwise generates a new UUID.
 * - Attaches requestId to request object for downstream logging/tracing.
 */
export async function requestIdMiddleware(
  req: FastifyRequest,
  reply: FastifyReply
) {
  let requestId = req.headers["x-request-id"] as string;
  if (!requestId) {
    requestId = uuidv4();
    // Optionally set header for downstream
    reply.header("X-Request-Id", requestId);
  }
  (req as any).id = requestId;
}
