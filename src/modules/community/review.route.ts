// Review Routes
// Registers review endpoints
import { FastifyInstance } from "fastify";
import { ReviewController } from "./review.controller";

export async function reviewRoutes(app: FastifyInstance) {
  const controller = new ReviewController();
  // Submit a review
  app.post("/api/client/reviews", controller.SubmitReview);
  // List reviews for a product
  app.get("/api/client/reviews/:productId", controller.listReviews);
}
