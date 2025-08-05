// Community Post Controller
// Handles community post endpoints
import { CommunityPostService } from "./communityPost.service";
import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../../utils/Logger";
import { publishToQueue } from "../../utils/rabbitmqClient";

const communityPostService = new CommunityPostService();

export class CommunityPostController {
  // Create a community post
  async CreatePost(req: FastifyRequest, res: FastifyReply) {
    logger.info(
      { user: req.user?.id, body: req.body },
      "Create community post request received"
    );
    try {
      const userId = req.user?.id;
      const data = req.body;
      const post = await communityPostService.createPost(userId || "", data);
      logger.info({ post }, "Community post created successfully");
      await publishToQueue("community_post_events", {
        type: "community_post_created",
        userId,
        data,
      });
      logger.info(
        { queue: "community_post_events", userId, data },
        "Community post event pushed to RabbitMQ"
      );
      res.send(post);
    } catch (err) {
      logger.error({ err }, "Failed to create community post");
      res.status(500).send({ error: "Failed to create community post" });
    }
  }

  // List posts in a space
  async ListPosts(req: FastifyRequest, res: FastifyReply) {
    logger.info(
      { spaceId: (req.params as any).spaceId },
      "List community posts request received"
    );
    try {
      const spaceId = (req.params as any).spaceId;
      const posts = await communityPostService.listPosts(spaceId);
      logger.info({ posts }, "Community posts fetched successfully");
      res.send(posts);
    } catch (err) {
      logger.error({ err }, "Failed to list community posts");
      res.status(500).send({ error: "Failed to list community posts" });
    }
  }
}
