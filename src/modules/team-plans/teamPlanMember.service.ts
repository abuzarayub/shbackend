import { eq } from "drizzle-orm";
import {
  db,
  team_plan_members as teamPlanMembersTable,
} from "../../db/Drizzle.config";

export class TeamPlanMemberService {
  async addMember(teamPlanId: string, userId: string, role: string) {
    const [member] = await db
      .insert(teamPlanMembersTable)
      .values({
        team_plan_id: teamPlanId,
        user_id: userId,
        role,
      })
      .returning();

    return member;
  }

  async listMembers(teamPlanId: string) {
    const members = await db
      .select()
      .from(teamPlanMembersTable)
      .where(eq(teamPlanMembersTable.team_plan_id, teamPlanId)); // ✅ FIXED

    return members;
  }
}
