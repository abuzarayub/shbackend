// Space Member Routes
// Registers space member endpoints
import { FastifyInstance } from "fastify";
import { SpaceMemberController } from "./spaceMember.controller";

export async function spaceMemberRoutes(app: FastifyInstance) {
  const controller = new SpaceMemberController();
  // Join a space
  app.post("/api/client/space-members", controller.joinSpace);
  // List members in a space
  app.get("/api/client/space-members/:spaceId", controller.listMembers);
}
