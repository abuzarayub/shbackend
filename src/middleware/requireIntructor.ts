import { FastifyRequest, FastifyReply } from "fastify";

export async function requireInstructor(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (request.user?.role !== "instructor") {
    return reply
      .status(403)
      .send({ message: "Access denied: Instructor only" });
  }
}
