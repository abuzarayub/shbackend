import { FastifyInstance } from "fastify";
import { registerController, loginController } from "./Auth.Controller";

export async function authRoutes(app: FastifyInstance) {
  app.post("/signup", registerController);
  app.post("/login", loginController);
}
