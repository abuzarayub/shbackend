import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.SUPABASE_JWT_SECRET!;

    const decoded = jwt.verify(token, secret) as {
      id: string;
      role: "admin" | "instructor" | "student";
      email: string;
    };

    request.user = decoded; // attach to request
  } catch (err) {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }
}
