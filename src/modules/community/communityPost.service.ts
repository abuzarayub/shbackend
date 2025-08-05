import { eq } from "drizzle-orm";
import {
  db,
  community_posts as communityPostsTable,
} from "../../db/Drizzle.config";

export class CommunityPostService {
  async createPost(userId: string, data: any) {
    const { space_id, content } = data;
    const [post] = await db
      .insert(communityPostsTable)
      .values({
        user_id: userId,
        space_id,
        content,
      })
      .returning();
    return post;
  }

  async listPosts(spaceId: string) {
    const posts = await db
      .select()
      .from(communityPostsTable)
      .where(eq(communityPostsTable.space_id, spaceId)); // ✅ FIXED

    return posts;
  }
}
