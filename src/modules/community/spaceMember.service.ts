import { eq } from "drizzle-orm";
import {
  db,
  space_members as spaceMembersTable,
} from "../../db/Drizzle.config";

export class SpaceMemberService {
  async joinSpace(userId: string, spaceId: string) {
    const [spaceMember] = await db
      .insert(spaceMembersTable)
      .values({
        space_id: spaceId,
        user_id: userId,
        status: "JOINED",
      })
      .returning();

    return spaceMember;
  }

  async listMembers(spaceId: string) {
    const members = await db
      .select()
      .from(spaceMembersTable)
      .where(eq(spaceMembersTable.space_id, spaceId)); // ✅ FIXED

    return members;
  }
}
