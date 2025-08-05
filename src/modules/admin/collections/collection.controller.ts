import { FastifyRequest, FastifyReply } from "fastify";
import { getSupabaseAdminClient } from "../../../utils/SupaBase";
import { getRabbitChannel } from "../../../utils/rabbitmq";

export class AdminCollectionsController {
  async listCollections(req: FastifyRequest, res: FastifyReply) {
    try {
      const supabase = getSupabaseAdminClient();

      const { data, error } = await supabase.from("collections").select(`
          id,
          name,
          description
        `);

      if (error) throw error;

      // Calculate stats in backend
      const total = data.length;
      const withDescription = data.filter(
        (c: any) => c.description && c.description.trim() !== ""
      ).length;
      const withoutDescription = total - withDescription;
      const percent = (count: number) =>
        total > 0 ? Math.round((count / total) * 100) : 0;

      res.send({
        collections: data,
        stats: {
          total,
          withDescription,
          withoutDescription,
          withDescriptionPercent: percent(withDescription),
          withoutDescriptionPercent: percent(withoutDescription),
        },
      });
    } catch (err) {
      res.status(500).send({
        error: "Failed to fetch collections",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async createCollection(req: FastifyRequest, res: FastifyReply) {
    try {
      const collectionData = req.body;
      const supabase = getSupabaseAdminClient();

      const { data, error } = await supabase
        .from("collections")
        .insert(collectionData)
        .select();

      if (error) throw error;

      // Log action to RabbitMQ
      const channel = getRabbitChannel();
      channel.sendToQueue(
        "admin_activities",
        Buffer.from(
          JSON.stringify({
            action: "collection_created",
            admin_id: (req as any).user.id,
            target_id: data[0].id,
          })
        )
      );

      res.status(201).send(data[0]);
    } catch (err) {
      res.status(500).send({
        error: "Failed to create collection",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
