// Transaction Controller
// Handles transaction endpoints
import { TransactionService } from "./transaction.service";
import { FastifyRequest, FastifyReply } from "fastify";
import { logger, getRequestLogger } from "../../utils/Logger";
import { publishToQueue } from "../../utils/rabbitmqClient";

const transactionService = new TransactionService();

export class TransactionController {
  // Create a transaction (purchase)
  async createTransaction(req: FastifyRequest, res: FastifyReply) {
    const reqLogger = getRequestLogger({
      requestId: req.id,
      userId: req.user?.id,
    });
    reqLogger.info(
      { user: req.user?.id, body: req.body },
      "Create transaction request received"
    );
    try {
      const userId = req.user?.id;
      const data = req.body as any;

      // Warning for suspicious payment amounts
      if ((data as any).amount && Number((data as any).amount) > 1000) {
        reqLogger.warn(
          { userId: userId || "", amount: (data as any).amount },
          "High-value transaction detected"
        );
      }

      const transaction = await transactionService.createTransaction(
        userId || "",
        data
      );
      reqLogger.info({ transaction }, "Transaction created successfully");
      await publishToQueue("transaction_events", {
        type: "transaction_created",
        userId: userId || "",
        data,
      });
      reqLogger.info(
        { queue: "transaction_events", userId: userId || "", data },
        "Transaction event pushed to RabbitMQ"
      );
      res.send(transaction);
    } catch (err) {
      reqLogger.error({ err }, "Failed to create transaction");
      res.status(500).send({ error: "Failed to create transaction" });
    }
  }

  // Get user transactions
  async getTransactions(req: FastifyRequest, res: FastifyReply) {
    const reqLogger = getRequestLogger({
      requestId: req.id,
      userId: req.user?.id,
    });
    reqLogger.info({ user: req.user?.id }, "Get transactions request received");
    try {
      const userId = req.user?.id;
      const transactions = await transactionService.getTransactions(
        userId || ""
      );
      reqLogger.info({ transactions }, "Transactions fetched successfully");
      res.send(transactions);
    } catch (err) {
      reqLogger.error({ err }, "Failed to get transactions");
      res.status(500).send({ error: "Failed to get transactions" });
    }
  }
}
