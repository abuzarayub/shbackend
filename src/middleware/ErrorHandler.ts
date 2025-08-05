/**
 * Global error handler for Fastify.
 * Logs errors with context, pushes to Redis, and returns a structured error response.
 * @param error - The error object
 * @param req - The Fastify request
 * @param reply - The Fastify reply
 */
import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../utils/Logger";
import { pushErrorLog } from "../utils/redis";
import { logErrorToDB } from "../utils/logError";
import { v4 as uuidv4 } from "uuid";

export function globalErrorHandler(
  error: FastifyError & { statusCode?: number },
  req: FastifyRequest,
  reply: FastifyReply
) {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  // Generate a unique support code for this error
  const supportCode = uuidv4();
  // Extract requestId if available (e.g., from headers or request context)
  const requestId =
    (req.headers["x-request-id"] as string) || (req as any).id || undefined;

  // Log error with context and support code
  logger.error(
    {
      err: error,
      url: req.url,
      method: req.method,
      user: (req as any).user || undefined,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
      statusCode,
      supportCode,
      requestId,
    },
    "Request error"
  );

  // Push error to Redis for monitoring
  pushErrorLog({
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    user: (req as any).user,
    time: new Date().toISOString(),
    supportCode,
    requestId,
  });

  // Log error to DB for persistent tracking
  logErrorToDB("globalErrorHandler", {
    ...error,
    supportCode,
    requestId,
    url: req.url,
    method: req.method,
    user: (req as any).user,
  });

  reply.status(statusCode).send({
    success: false,
    statusCode,
    message,
    supportCode,
    // Only include stack in development
    ...(process.env.NODE_ENV === "development" && error.stack
      ? { stack: error.stack }
      : {}),
  });
}
