// Team Plan Service
// Handles team plan business logic
import { setCache, getCache } from "../../utils/redisClient";
import { publishToQueue } from "../../utils/rabbitmqClient";

export class TeamPlanService {
  // Get team plans, using Redis cache
  async getTeamPlans() {
    const cacheKey = "teamplans:all";
    let teamPlans = await getCache(cacheKey);
    if (!teamPlans) {
      // TODO: Fetch from DB
      // Simulate DB fetch
      teamPlans = [
        { id: "tp1", name: "Small Team" },
        { id: "tp2", name: "Enterprise" },
      ];
      await setCache(cacheKey, teamPlans, 3600);
    }
    return teamPlans;
  }

  // Add a new team plan and publish event to RabbitMQ
  async addTeamPlan(data: any) {
    // TODO: Insert team plan in DB
    // Simulate DB insert
    const teamPlan = { id: "tp_new", ...data };
    // Invalidate cache
    const cacheKey = "teamplans:all";
    await setCache(cacheKey, null, 0);
    // Publish event
    await publishToQueue("teamplan_events", { type: "teamplan_added", data });
    return teamPlan;
  }
}
