// Community Post Routes
// Registers community post endpoints
import { FastifyInstance } from "fastify";
import { CommunityPostController } from "./communityPost.controller";

export async function communityPostRoutes(app: FastifyInstance) {
  const controller = new CommunityPostController();
  // Create a community post
  app.post("/api/client/community-posts", controller.CreatePost);
  // List posts in a space
  app.get("/api/client/community-posts/:spaceId", controller.ListPosts);
}
