import { FastifyRequest, FastifyReply } from "fastify";
import { getSupabaseAdminClient } from "../../../utils/SupaBase";
import { getRabbitChannel } from "../../../utils/rabbitmq";

export class AdminTransactionsController {
  async listTransactions(req: FastifyRequest, res: FastifyReply) {
    try {
      const { days } = req.query as any;
      const supabase = getSupabaseAdminClient();

      let query = supabase
        .from("transactions")
        .select(
          `
          id,
          amount,
          status,
          created_at,
          user:platform_users(full_name, email),
          next_billing_date,
          payment_method
        `
        )
        .order("created_at", { ascending: false });

      if (days) {
        const date = new Date();
        date.setDate(date.getDate() - parseInt(days));
        query = query.gte("created_at", date.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      res.send(data);
    } catch (err) {
      res.status(500).send({
        error: "Failed to fetch transactions",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async refundTransaction(req: FastifyRequest, res: FastifyReply) {
    try {
      const { transactionId } = req.params as any;
      const supabase = getSupabaseAdminClient();

      // Process refund logic here
      const { data, error } = await supabase
        .from("transactions")
        .update({ status: "refunded" })
        .eq("id", transactionId)
        .select();

      if (error) throw error;

      // Log action to RabbitMQ
      const channel = getRabbitChannel();
      channel.sendToQueue(
        "admin_activities",
        Buffer.from(
          JSON.stringify({
            action: "transaction_refunded",
            admin_id: (req as any).user.id,
            target_id: transactionId,
          })
        )
      );

      // Send to payment processing queue
      channel.sendToQueue(
        "payment_processing",
        Buffer.from(
          JSON.stringify({
            type: "refund",
            transaction_id: transactionId,
          })
        )
      );

      res.send(data[0]);
    } catch (err) {
      res.status(500).send({
        error: "Failed to process refund",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async transactionStats(req: FastifyRequest, res: FastifyReply) {
    try {
      const supabase = getSupabaseAdminClient();

      const now = new Date();
      const last7Days = new Date();
      last7Days.setDate(now.getDate() - 7);

      const prev7Days = new Date();
      prev7Days.setDate(now.getDate() - 14);

      const fetchRange = async (from: Date, to: Date) => {
        const { data, error } = await supabase
          .from("transactions")
          .select("amount, status, created_at")
          .gte("created_at", from.toISOString())
          .lt("created_at", to.toISOString());

        if (error) throw error;
        return data;
      };

      const current = await fetchRange(last7Days, now);
      const previous = await fetchRange(prev7Days, last7Days);

      const sumByStatus = (list: any[], status: string) =>
        list
          .filter((tx) => tx.status === status)
          .reduce((sum, tx) => sum + tx.amount, 0);

      const txCount = (list: any[], status?: string) =>
        status ? list.filter((tx) => tx.status === status).length : list.length;

      const getGrowth = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
      };

      const metrics = {
        total: {
          currentAmount: current.reduce((sum, tx) => sum + tx.amount, 0),
          previousAmount: previous.reduce((sum, tx) => sum + tx.amount, 0),
          currentCount: current.length,
          previousCount: previous.length,
        },
        success: {
          currentAmount: sumByStatus(current, "success"),
          previousAmount: sumByStatus(previous, "success"),
          currentCount: txCount(current, "success"),
          previousCount: txCount(previous, "success"),
        },
        failed: {
          currentAmount: sumByStatus(current, "failed"),
          previousAmount: sumByStatus(previous, "failed"),
          currentCount: txCount(current, "failed"),
          previousCount: txCount(previous, "failed"),
        },
        pending: {
          currentAmount: sumByStatus(current, "pending"),
          previousAmount: sumByStatus(previous, "pending"),
          currentCount: txCount(current, "pending"),
          previousCount: txCount(previous, "pending"),
        },
      };

      const format = (section: any) => ({
        amount: section.currentAmount,
        count: section.currentCount,
        amountGrowth: getGrowth(section.currentAmount, section.previousAmount),
        countGrowth: getGrowth(section.currentCount, section.previousCount),
      });

      res.send({
        total: format(metrics.total),
        success: format(metrics.success),
        failed: format(metrics.failed),
        pending: format(metrics.pending),
      });
    } catch (err) {
      res.status(500).send({
        error: "Failed to fetch transaction metrics",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
