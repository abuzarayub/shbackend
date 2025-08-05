// Review Controller
// Handles review endpoints
import { ReviewService } from "./review.service";
import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../../utils/Logger";
import { publishToQueue } from "../../utils/rabbitmqClient";

const reviewService = new ReviewService();

export class ReviewController {
  // Submit a review
  async SubmitReview(req: FastifyRequest, res: FastifyReply) {
    logger.info(
      { user: req.user?.id, body: req.body },
      "Submit review request received"
    );
    try {
      const userId = req.user?.id;
      const data = req.body;
      const review = await reviewService.submitReview(userId || "", data);
      logger.info({ review }, "Review submitted successfully");
      await publishToQueue("review_events", {
        type: "review_submitted",
        userId,
        data,
      });
      logger.info(
        { queue: "review_events", userId, data },
        "Review event pushed to RabbitMQ"
      );
      res.send(review);
    } catch (err) {
      logger.error({ err }, "Failed to submit review");
      res.status(500).send({ error: "Failed to submit review" });
    }
  }

  // List reviews for a product
  async listReviews(req: FastifyRequest, res: FastifyReply) {
    logger.info(
      { productId: (req.params as any).productId },
      "List reviews request received"
    );
    try {
      const productId = (req.params as any).productId;
      const reviews = await reviewService.listReviews(productId);
      logger.info({ reviews }, "Reviews fetched successfully");
      res.send(reviews);
    } catch (err) {
      logger.error({ err }, "Failed to list reviews");
      res.status(500).send({ error: "Failed to list reviews" });
    }
  }
}
