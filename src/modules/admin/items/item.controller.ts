import { FastifyRequest, FastifyReply } from "fastify";
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../../../utils/SupaBase";
import { getRabbitChannel } from "../../../utils/rabbitmq";

interface User {
  name: string;
  email: string;
}

interface Item {
  id: string;
  title: string;
  code: string;
  status: "published" | "draft";
  created_at: string;
  updated_at: string;
  author?: User;
  bookmarks_count: number;
}

interface ItemCreateData {
  title: string;
  description?: string;
  content?: string;
}

interface ItemUpdateStatusData {
  status: "published" | "draft";
}

export class AdminItemsController {
  async listItems(
    req: FastifyRequest<{
      Querystring: {
        status?: "all" | "published" | "draft";
        search?: string;
      };
    }>,
    res: FastifyReply
  ) {
    try {
      const { status = "all", search = "" } = req.query;
      const supabase = getSupabaseAdminClient();

      // Define the base query with proper typing
      let query = supabase
        .from("products")
        .select(
          `
          id,
          type,
          status,
          created_at,
          updated_at
        `
        )
        .order("created_at", { ascending: false });

      if (status !== "all") {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.ilike("type", `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Type assertion for the response data
      const items = data as unknown as Item[];

      res.send({
        items,
        stats: {
          total: await this.getItemCount(supabase),
          published: await this.getItemCount(supabase, "active"),
          draft: await this.getItemCount(supabase, "inactive"),
        },
      });
    } catch (err) {
      res.status(500).send({
        error: "Failed to fetch items",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async createItem(
    req: FastifyRequest<{ Body: ItemCreateData }>,
    res: FastifyReply
  ) {
    try {
      const itemData = req.body;
      const supabase = getSupabaseAdminClient();

      const fullItemData = {
        type: itemData.title, // Map title to type field
        status: "inactive", // Use inactive instead of draft
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("products")
        .insert(fullItemData)
        .select();

      if (error) throw error;

      // Type assertion for the inserted data
      const insertedItem = data[0] as unknown as Item;

      // Try to send to RabbitMQ, but don't fail if it's not available
      try {
        const channel = getRabbitChannel();
        channel.sendToQueue(
          "admin_activities",
          Buffer.from(
            JSON.stringify({
              action: "item_created",
              admin_id: (req as any).user.id,
              target_id: insertedItem.id,
            })
          )
        );
      } catch (rabbitError) {
        console.log("RabbitMQ not available, skipping queue message");
      }

      res.status(201).send(insertedItem);
    } catch (err) {
      console.error("Error creating item:", err);
      res.status(500).send({
        error: "Failed to create item",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async updateItemStatus(
    req: FastifyRequest<{
      Params: { id: string };
      Body: { status: "active" | "inactive" };
    }>,
    res: FastifyReply
  ) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const supabase = getSupabaseAdminClient();

      const { data, error } = await supabase
        .from("products")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();

      if (error) throw error;

      // Type assertion for the updated data
      const updatedItem = data[0] as unknown as Item;

      // Try to send to RabbitMQ, but don't fail if it's not available
      try {
        const channel = getRabbitChannel();
        channel.sendToQueue(
          "admin_activities",
          Buffer.from(
            JSON.stringify({
              action: `item_${status}`,
              admin_id: (req as any).user.id,
              target_id: id,
            })
          )
        );
      } catch (rabbitError) {
        console.log("RabbitMQ not available, skipping queue message");
      }

      res.send(updatedItem);
    } catch (err) {
      res.status(500).send({
        error: "Failed to update item status",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private async getItemCount(
    supabase: SupabaseClient,
    status?: "active" | "inactive"
  ): Promise<number> {
    let query = supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  // In AdminItemsController.ts

  async getDashboardStats(req: FastifyRequest, res: FastifyReply) {
    try {
      const supabase = getSupabaseAdminClient();
      const now = new Date();
      const last30Days = new Date(now);
      last30Days.setDate(last30Days.getDate() - 30);

      // Item Growth Calculation
      const { count: currentItems } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .gte("created_at", last30Days.toISOString());

      const { count: totalItems } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Handle null cases safely
      const currentItemsCount = currentItems ?? 0;
      const totalItemsCount = totalItems ?? 0;

      // Calculate growth percentage
      const itemGrowth =
        totalItemsCount > 0 ? (currentItemsCount / totalItemsCount) * 100 : 100;

      res.send({
        totalItems: totalItemsCount,
        publishedItems: await this.getItemCount(supabase, "active"),
        draftItems: await this.getItemCount(supabase, "inactive"),
        itemGrowth: parseFloat(itemGrowth.toFixed(1)), // Ensure number type
      });
    } catch (err) {
      res.status(500).send({
        error: "Failed to fetch item stats",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Add this to your AdminUserController class
  private async getPublishedContentCount(supabase: any): Promise<number> {
    const { count } = await supabase
      .from("content")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");
    return count ?? 0;
  }

  public async getContentStats(supabase: any) {
    const { count: totalContent } = await supabase
      .from("content")
      .select("*", { count: "exact", head: true });

    const { count: newContent } = await supabase
      .from("content")
      .select("*", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    const growth =
      totalContent > 0
        ? (newContent / totalContent) * 100
        : newContent > 0
          ? 100
          : 0;

    return {
      total: totalContent ?? 0,
      published: await this.getPublishedContentCount(supabase),
      growth: parseFloat(growth.toFixed(1)),
    };
  }
}
