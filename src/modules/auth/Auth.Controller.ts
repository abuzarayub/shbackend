import { FastifyRequest, FastifyReply } from "fastify";
import { registerUser, loginUser } from "../../modules/auth/Auth.Service";
import { loginSchema, registerSchema } from "./Auth.Schema";
import { ZodError } from "zod";

export const registerController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  debugger; // Debugger statement for manual API testing
  try {
    const parsed = registerSchema.parse(req.body);
    const { user, token } = await registerUser(parsed);
    return reply.code(201).send({ message: "User registered", token, user });
  } catch (err) {
    if (err instanceof ZodError) {
      return reply.code(400).send({
        error: "Validation failed",
        details: err.issues,
      });
    }
    return reply.code(400).send({
      error: err instanceof Error ? err.message : "Something went wrong",
    });
  }
};

export const loginController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const { token, user } = await loginUser(parsed);
    return reply.code(200).send({ message: "Login successful", token, user });
  } catch (err) {
    return reply.code(400).send({
      error: err instanceof Error ? err.message : "Something went wrong",
    });
  }
};
