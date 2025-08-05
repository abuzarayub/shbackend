import { db, payouts as payoutsTable } from "../../db/Drizzle.config";

export class PayoutService {
  async createPayout(adminId: string, data: any) {
    const { instructor_id, amount, status } = data;

    const [payout] = await db
      .insert(payoutsTable)
      .values({
        instructor_id,
        amount: String(amount),
        status: status || "PENDING",
      })
      .returning();

    return {
      ...payout,
      amount: Number(payout.amount), // ✅ cast safely
    };
  }

  async getPayouts() {
    const payouts = await db.select().from(payoutsTable);

    return payouts.map((p) => ({
      ...p,
      amount: Number(p.amount), // ✅ cast safely for each payout
    }));
  }
}
