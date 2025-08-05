// Team Plan Routes
// Registers team plan endpoints
import { FastifyInstance } from "fastify";
import { TeamPlanController } from "./team-plan.controller";

export async function teamPlanRoutes(app: FastifyInstance) {
  const controller = new TeamPlanController();
  // Get team plans
  app.get("/api/client/team-plans", controller.getTeamPlans);
  // Add team plan
  app.post("/api/admin/team-plans", controller.addTeamPlan);
}
