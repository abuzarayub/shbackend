// Team Plan Routes
// Registers team plan endpoints
import { FastifyInstance } from "fastify";
import { TeamPlanController } from "./teamPlan.controller";

export async function teamPlanRoutes(app: FastifyInstance) {
  const controller = new TeamPlanController();
  // Create a team plan
  app.post("/api/client/team-plans", controller.CreateTeamPlan);
  // List team plans
  app.get("/api/client/team-plans", controller.ListTeamPlans);
}
