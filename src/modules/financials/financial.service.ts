// Financial Service
// Handles financial management business logic
import { setCache, getCache } from "../../utils/redisClient";
import { publishToQueue } from "../../utils/rabbitmqClient";

export class FinancialService {
  // Get user transactions, using Redis cache
  async getTransactions(userId: string) {
    const cacheKey = `transactions:${userId}`;
    let transactions = await getCache(cacheKey);
    if (!transactions) {
      // TODO: Fetch from DB
      // Simulate DB fetch
      transactions = [
        { id: "txn1", user_id: userId, amount: 100, status: "COMPLETED" },
        { id: "txn2", user_id: userId, amount: 50, status: "PENDING" },
      ];
      await setCache(cacheKey, transactions, 3600);
    }
    return transactions;
  }

  // Record a new transaction and publish event to RabbitMQ
  async recordTransaction(userId: string, data: any) {
    // TODO: Insert transaction in DB
    // Simulate DB insert
    const transaction = { id: "txn_new", user_id: userId, ...data };
    // Invalidate cache
    const cacheKey = `transactions:${userId}`;
    await setCache(cacheKey, null, 0);
    // Publish event
    await publishToQueue("transaction_events", {
      type: "transaction_recorded",
      userId,
      data,
    });
    return transaction;
  }
}
