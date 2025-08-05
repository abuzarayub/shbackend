// Team Plan Service
// Handles team plan business logic
import { db, team_plans as teamPlansTable } from "../../db/Drizzle.config";

export class TeamPlanService {
  // Create a team plan
  async createTeamPlan(userId: string, data: any) {
    // Insert team plan in DB
    const { name, details } = data;
    const [teamPlan] = await db
      .insert(teamPlansTable)
      .values({
        owner_id: userId,
        name,
        details: details || null,
      })
      .returning();
    return teamPlan;
  }

  // List team plans
  async listTeamPlans() {
    // Fetch from DB
    const teamPlans = await db.select().from(teamPlansTable);
    return teamPlans;
  }
}
