// Team Plan Member Controller
// Handles team plan member endpoints
import { TeamPlanMemberService } from "./teamPlanMember.service";
import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../../utils/Logger";
import { publishToQueue } from "../../utils/rabbitmqClient";

const teamPlanMemberService = new TeamPlanMemberService();

export class TeamPlanMemberController {
  // Add a member to a team plan
  async addMember(req: FastifyRequest, res: FastifyReply) {
    logger.info(
      { user: req.user?.id, body: req.body },
      "Add team plan member request received"
    );
    try {
      const { team_plan_id, user_id, role } = req.body as any;
      const member = await teamPlanMemberService.addMember(
        team_plan_id,
        user_id,
        role
      );
      logger.info({ member }, "Team plan member added successfully");
      await publishToQueue("team_plan_member_events", {
        type: "team_plan_member_added",
        team_plan_id,
        user_id,
        role,
      });
      logger.info(
        { queue: "team_plan_member_events", team_plan_id, user_id, role },
        "Team plan member event pushed to RabbitMQ"
      );
      res.send(member);
    } catch (err) {
      logger.error({ err }, "Failed to add team plan member");
      res.status(500).send({ error: "Failed to add team plan member" });
    }
  }

  // List members of a team plan
  async ListMembers(req: FastifyRequest, res: FastifyReply) {
    logger.info(
      { teamPlanId: (req.params as any).teamPlanId },
      "List team plan members request received"
    );
    try {
      const teamPlanId = (req.params as any).teamPlanId;
      const members = await teamPlanMemberService.listMembers(teamPlanId);
      logger.info({ members }, "Team plan members fetched successfully");
      res.send(members);
    } catch (err) {
      logger.error({ err }, "Failed to list team plan members");
      res.status(500).send({ error: "Failed to list team plan members" });
    }
  }
}
