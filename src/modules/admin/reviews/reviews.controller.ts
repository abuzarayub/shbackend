import { FastifyRequest, FastifyReply } from "fastify";
import { getSupabaseAdminClient } from "../../../utils/SupaBase";
import { getRabbitChannel } from "../../../utils/rabbitmq";

export class AdminReviewsController {
  async listReviews(req: FastifyRequest, res: FastifyReply) {
    try {
      const { status } = req.query as any;
      const supabase = getSupabaseAdminClient();

      let query = supabase.from("reviews").select(`
          id,
          rating,
          comment,
          status,
          created_at,
          item:products(type, status),
          user:platform_users(full_name)
        `);

      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) throw error;

      // Calculate stats in backend
      const total = data.length;
      const published = data.filter(
        (r: any) => r.status === "Published"
      ).length;
      const rejected = data.filter((r: any) => r.status === "Rejected").length;
      const pending = data.filter((r: any) => r.status === "Pending").length;
      const percent = (count: number) =>
        total > 0 ? Math.round((count / total) * 100) : 0;

      res.send({
        reviews: data,
        stats: {
          total,
          published,
          rejected,
          pending,
          publishedPercent: percent(published),
          rejectedPercent: percent(rejected),
          pendingPercent: percent(pending),
        },
      });
    } catch (err) {
      res.status(500).send({
        error: "Failed to fetch reviews",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async moderateReview(req: FastifyRequest, res: FastifyReply) {
    try {
      const { reviewId } = req.params as any;
      const { status } = req.body as any;
      const supabase = getSupabaseAdminClient();

      const { data, error } = await supabase
        .from("reviews")
        .update({ status })
        .eq("id", reviewId)
        .select();

      if (error) throw error;

      // Log action to RabbitMQ
      const channel = getRabbitChannel();
      channel.sendToQueue(
        "admin_activities",
        Buffer.from(
          JSON.stringify({
            action: "review_moderated",
            admin_id: (req as any).user.id,
            target_id: reviewId,
            metadata: { status },
          })
        )
      );

      res.send(data[0]);
    } catch (err) {
      res.status(500).send({
        error: "Failed to moderate review",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
