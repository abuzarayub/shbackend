// src/types/fastify.ts (or wherever your declaration is)
import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      role: "admin" | "instructor" | "student";
      email: string;
    };
    admin?: {
      id: string;
      permissions: string[];
    };
  }
}
