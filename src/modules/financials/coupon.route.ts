// Coupon Routes
// Registers coupon endpoints
import { FastifyInstance } from "fastify";
import { CouponController } from "./coupon.controller";

export async function couponRoutes(app: FastifyInstance) {
  const controller = new CouponController();
  // Redeem a coupon
  app.post("/api/client/coupons/redeem", controller.RedeemCoupon);
}
