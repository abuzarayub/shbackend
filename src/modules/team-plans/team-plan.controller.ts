// Team Plan Controller
// Handles team plan endpoints
import { TeamPlanService } from "./team-plan.service";
import { FastifyRequest, FastifyReply } from "fastify";

const teamPlanService = new TeamPlanService();

export class TeamPlanController {
  // Get team plans endpoint
  async getTeamPlans(req: FastifyRequest, res: FastifyReply) {
    try {
      const teamPlans = await teamPlanService.getTeamPlans();
      res.send(teamPlans);
    } catch (err) {
      res.status(500).send({ error: "Failed to get team plans" });
    }
  }

  // Add team plan endpoint
  async addTeamPlan(req: FastifyRequest, res: FastifyReply) {
    try {
      const data = req.body;
      const teamPlan = await teamPlanService.addTeamPlan(data);
      res.send(teamPlan);
    } catch (err) {
      res.status(500).send({ error: "Failed to add team plan" });
    }
  }
}
