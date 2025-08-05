// Team Plan Controller
// Handles team plan endpoints
import { TeamPlanService } from "./teamPlan.service";
import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../../utils/Logger";
import { publishToQueue } from "../../utils/rabbitmqClient";

const teamPlanService = new TeamPlanService();

export class TeamPlanController {
  // Create a team plan
  async CreateTeamPlan(req: FastifyRequest, res: FastifyReply) {
    logger.info(
      { user: req.user?.id, body: req.body },
      "Create team plan request received"
    );
    try {
      const userId = req.user?.id;
      const data = req.body;
      const teamPlan = await teamPlanService.createTeamPlan(userId || "", data);
      logger.info({ teamPlan }, "Team plan created successfully");
      await publishToQueue("team_plan_events", {
        type: "team_plan_created",
        userId,
        data,
      });
      logger.info(
        { queue: "team_plan_events", userId, data },
        "Team plan event pushed to RabbitMQ"
      );
      res.send(teamPlan);
    } catch (err) {
      logger.error({ err }, "Failed to create team plan");
      res.status(500).send({ error: "Failed to create team plan" });
    }
  }

  // List team plans
  async ListTeamPlans(req: FastifyRequest, res: FastifyReply) {
    logger.info({ user: req.user?.id }, "List team plans request received");
    try {
      const teamPlans = await teamPlanService.listTeamPlans();
      logger.info({ teamPlans }, "Team plans fetched successfully");
      res.send(teamPlans);
    } catch (err) {
      logger.error({ err }, "Failed to list team plans");
      res.status(500).send({ error: "Failed to list team plans" });
    }
  }
}
