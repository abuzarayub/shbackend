import { authenticate } from "../../middleware/autheticate";
import { AdminCollectionsController } from "./collections/collection.controller";
import { AdminReviewsController } from "./reviews/reviews.controller";
import { AdminTransactionsController } from "./transaction/transaction.controller";
import { AdminUserController } from "./user/user.controller";
import { AdminItemsController } from "./items/item.controller";
import { verifyAdminRole } from "../../middleware/auth";
import { FastifyInstance } from "fastify";

export async function adminRoutes(fastify: FastifyInstance) {
  // Apply authentication hooks - first authenticate, then verify admin role
  fastify.addHook("onRequest", authenticate);
  fastify.addHook("onRequest", verifyAdminRole);

  // Initialize controllers
  const userController = new AdminUserController();
  const collectionsController = new AdminCollectionsController();
  const reviewsController = new AdminReviewsController();
  const transactionsController = new AdminTransactionsController();
  const itemsController = new AdminItemsController();

  /* ======================== */
  /*          USERS           */
  /* ======================== */
  // GET /admin/users - List all users
  fastify.get("/users", userController.listUsers.bind(userController));

  // PATCH /admin/users/:userId - Update user
  fastify.patch(
    "/users/:userId",
    userController.updateUser.bind(userController)
  );

  // GET /admin/dashboard-overview - Get dashboard stats
  fastify.get(
    "/dashboard-overview",
    userController.getDashboardOverview.bind(userController)
  );

  /* ======================== */
  /*        COLLECTIONS       */
  /* ======================== */
  // GET /admin/collections - List all collections
  fastify.get(
    "/collections",
    collectionsController.listCollections.bind(collectionsController)
  );

  // POST /admin/collections - Create new collection
  fastify.post(
    "/collections",
    collectionsController.createCollection.bind(collectionsController)
  );

  /* ======================== */
  /*          ITEMS           */
  /* ======================== */
  // GET /admin/items - List all items (with optional status filter)
  fastify.get("/items", itemsController.listItems.bind(itemsController));

  // POST /admin/items - Create new item
  fastify.post("/items", itemsController.createItem.bind(itemsController));

  // PATCH /admin/items/:id/status - Update item status (published/draft)
  fastify.patch(
    "/items/:id/status",
    itemsController.updateItemStatus.bind(itemsController)
  );

  // GET /admin/content/stats - Get content statistics for dashboard
  fastify.get(
    "/content/stats",
    itemsController.getContentStats.bind(itemsController)
  );

  /* ======================== */
  /*         REVIEWS          */
  /* ======================== */
  // GET /admin/reviews - List all reviews
  fastify.get(
    "/reviews",
    reviewsController.listReviews.bind(reviewsController)
  );

  // PATCH /admin/reviews/:reviewId - Moderate review
  fastify.patch(
    "/reviews/:reviewId",
    reviewsController.moderateReview.bind(reviewsController)
  );

  /* ======================== */
  /*      TRANSACTIONS        */
  /* ======================== */
  // GET /admin/transactions - List all transactions
  fastify.get(
    "/transactions",
    transactionsController.listTransactions.bind(transactionsController)
  );

  // PATCH /admin/transactions/:transactionId/change-status - Change transaction status
  fastify.patch(
    "/transactions/:transactionId/change-status",
    transactionsController.transactionStats.bind(transactionsController)
  );

  // POST /admin/transactions/:transactionId/refund - Process refund
  fastify.post(
    "/transactions/:transactionId/refund",
    transactionsController.refundTransaction.bind(transactionsController)
  );
}
