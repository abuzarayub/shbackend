import { eq } from "drizzle-orm";
import { setCache, getCache } from "../../utils/redisClient";
import { db, transactions as transactionsTable } from "../../db/Drizzle.config";

export class TransactionService {
  async createTransaction(userId: string, data: any) {
    const { amount, status } = data;
    const [transaction] = await db
      .insert(transactionsTable)
      .values({
        user_id: userId,
        amount: String(amount),
        status: status || "PENDING",
      })
      .returning();

    const cacheKey = `transactions:${userId}`;
    await setCache(cacheKey, null, 0);

    return {
      ...transaction,
      amount: Number(transaction.amount), // safely override type
    };
  }

  async getTransactions(userId: string) {
    const cacheKey = `transactions:${userId}`;
    let transactions = await getCache(cacheKey);
    if (!transactions) {
      transactions = await db
        .select()
        .from(transactionsTable)
        .where(eq(transactionsTable.user_id, userId)); // fixed here

      transactions = transactions.map((txn: any) => ({
        ...txn,
        amount: Number(txn.amount),
      }));

      await setCache(cacheKey, transactions, 3600);
    }
    return transactions;
  }
}
