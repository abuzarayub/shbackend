// Team Plan Member Routes
// Registers team plan member endpoints
import { FastifyInstance } from "fastify";
import { TeamPlanMemberController } from "./teamPlanMember.controller";

export async function teamPlanMemberRoutes(app: FastifyInstance) {
  const controller = new TeamPlanMemberController();
  // Add a member to a team plan
  app.post("/api/client/team-plan-members", controller.addMember);
  // List members of a team plan
  app.get("/api/client/team-plan-members/:teamPlanId", controller.ListMembers);
}
