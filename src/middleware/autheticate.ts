import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    // Development bypass for testing (only in development)
    if (
      process.env.NODE_ENV === "development" &&
      authHeader === "Bearer dev-bypass"
    ) {
      request.user = {
        id: "dev-test-user-id",
        email: "dev@test.com",
        role: "student",
      };
      return;
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.SUPABASE_JWT_SECRET!;
    const decoded: any = jwt.verify(token, secret);

    const CLAIM_NAMESPACE = "https://checkpook.com/claims";

    if (
      !decoded ||
      (!decoded.sub &&
        !(decoded[CLAIM_NAMESPACE] && decoded[CLAIM_NAMESPACE].user_id)) ||
      !decoded[CLAIM_NAMESPACE]
    ) {
      return reply
        .status(401)
        .send({ message: "Invalid JWT: missing required claims." });
    }

    // Attach user info to request
    request.user = {
      id: decoded[CLAIM_NAMESPACE].user_id || decoded.sub, // Prefer user_id, fallback to sub
      email: decoded.email,
      role: decoded[CLAIM_NAMESPACE].role,
    };
  } catch (err) {
    console.error("JWT error:", err);
    return reply.status(401).send({ message: "Invalid or expired token" });
  }
}
