import { eq } from "drizzle-orm";
import { db, reviews as reviewsTable } from "../../db/Drizzle.config";

export class ReviewService {
  async submitReview(userId: string, data: any) {
    const { product_id, rating, content } = data;

    const [review] = await db
      .insert(reviewsTable)
      .values({
        user_id: userId,
        product_id,
        rating: String(rating),
        content,
      })
      .returning();

    return {
      ...review,
      rating: Number(review.rating), // ✅ safely override type
    };
  }

  async listReviews(productId: string) {
    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.product_id, productId)); // ✅ correct Drizzle usage

    return reviews.map((r) => ({
      ...r,
      rating: Number(r.rating), // ✅ override safely
    }));
  }
}
