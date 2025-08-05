import { eq } from "drizzle-orm";
import { db, coupons as couponsTable } from "../../db/Drizzle.config";

export class CouponService {
  async redeemCoupon(userId: string, code: string) {
    // Find coupon by code
    const [coupon] = await db
      .select()
      .from(couponsTable)
      .where(eq(couponsTable.code, code)); // ✅ FIXED

    if (!coupon) {
      throw new Error("Coupon not found");
    }

    // Mark as redeemed
    const [updatedCoupon] = await db
      .update(couponsTable)
      .set({ status: "REDEEMED" })
      .where(eq(couponsTable.id, coupon.id)) // ✅ FIXED
      .returning();

    return {
      user_id: userId,
      code,
      status: updatedCoupon.status,
      discount: Number(updatedCoupon.discount),
    };
  }
}
