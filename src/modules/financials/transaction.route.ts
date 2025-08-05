// Transaction Routes
// Registers transaction endpoints
import { FastifyInstance } from "fastify";
import { TransactionController } from "./transaction.controller";

export async function transactionRoutes(app: FastifyInstance) {
  const controller = new TransactionController();
  // Create a transaction (purchase)
  app.post("/api/client/transactions", controller.createTransaction);
  // Get user transactions
  app.get("/api/client/transactions", controller.getTransactions);
}
