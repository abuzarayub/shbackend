// Financial Routes
// Registers financial management endpoints
import { FastifyInstance } from "fastify";
import { FinancialController } from "./financial.controller";

export async function financialRoutes(app: FastifyInstance) {
  const controller = new FinancialController();
  // Get user transactions
  app.get("/api/client/transactions", controller.getTransactions);
  // Record transaction
  app.post("/api/client/transactions", controller.recordTransaction);
}
