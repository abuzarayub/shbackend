import { getRabbitChannel } from "../../../utils/rabbitmq";
import { getSupabaseAdminClient } from "../../../utils/SupaBase";
import { FastifyReply, FastifyRequest } from "fastify";
import { AdminItemsController } from "../items/item.controller";

export class AdminUserController {
  async listUsers(req: FastifyRequest, res: FastifyReply) {
    try {
      const { page = 1, limit = 10, role, status, query } = req.query as any;
      const supabase = getSupabaseAdminClient();

      // Build query for users
      let dbQuery = supabase
        .from("platform_users")
        .select("*", { count: "exact" })
        .range((page - 1) * limit, page * limit - 1);

      if (role) dbQuery = dbQuery.eq("role", role);
      if (status) dbQuery = dbQuery.eq("status", status);
      if (query) {
        dbQuery = dbQuery.or(`email.ilike.%${query}%,name.ilike.%${query}%`);
      }

      const { data: users, count, error } = await dbQuery;
      if (error) throw error;

      // Send admin activity to RabbitMQ
      const channel = getRabbitChannel();
      channel.sendToQueue(
        "admin_activities",
        Buffer.from(
          JSON.stringify({
            action: "users_listed",
            admin_id: (req as any).user.id,
            metadata: { page, limit },
          })
        )
      );

      // Get stats
      const stats = await this.getUserStats(supabase);

      res.send({
        users,
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit),
        },
        stats,
      });
    } catch (err) {
      res.status(500).send({
        error: "Failed to fetch users",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async getDashboardOverview(req: FastifyRequest, res: FastifyReply) {
    try {
      const supabase = getSupabaseAdminClient();

      const userStats = await this.getUserStats(supabase);
      const contentStats = await this.getContentStatsWrapper(supabase);
      const transactionStats = await this.getTransactionStats(supabase);

      res.send({
        users: {
          total: userStats.totals.users,
          active: userStats.totals.active,
          growth: userStats.growth.user,
          activeGrowth: userStats.growth.active,
          instructors: userStats.totals.instructors,
          instructorGrowth: userStats.growth.instructor,
          students: userStats.totals.students,
          studentGrowth: userStats.growth.student,
        },
        content: contentStats,
        transactions: transactionStats,
      });
    } catch (err) {
      res.status(500).send({
        error: "Failed to fetch dashboard overview",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private async getUserStats(supabase: any) {
    const now = new Date();
    const last30 = new Date(now);
    const prev30 = new Date(now);
    last30.setDate(now.getDate() - 30);
    prev30.setDate(now.getDate() - 60);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const dayBefore = new Date(yesterday);
    dayBefore.setDate(yesterday.getDate() - 1);

    const getCount = async (
      from: Date,
      to?: Date,
      filters: Record<string, any> = {}
    ): Promise<number> => {
      let query = supabase
        .from("platform_users")
        .select("*", { count: "exact", head: true });

      // Only apply date filters if they're not the default "all time" filter
      if (from.getTime() > 0) {
        query = query.gte("created_at", from.toISOString());
      }
      if (to) query = query.lt("created_at", to.toISOString());

      Object.entries(filters).forEach(([k, v]) => (query = query.eq(k, v)));

      const { count } = await query;
      return count ?? 0;
    };

    const getActiveUserCount = async (
      from: Date,
      to: Date
    ): Promise<number> => {
      const { count } = await supabase
        .from("user_activity")
        .select("*", { count: "exact", head: true })
        .gte("last_active", from.toISOString())
        .lt("last_active", to.toISOString());
      return count ?? 0;
    };

    const calculateGrowth = (current: number, prev: number): number => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    // Get total users (all time)
    const totalUsers = await supabase
      .from("platform_users")
      .select("*", { count: "exact", head: true });

    // Get users from previous period for growth calculation
    const previousUsers = await supabase
      .from("platform_users")
      .select("*", { count: "exact", head: true })
      .lt("created_at", prev30.toISOString());

    // Get role-based counts
    const instructors = await supabase
      .from("platform_users")
      .select("*", { count: "exact", head: true })
      .eq("role", "instructor");

    const instructorsPrev = await supabase
      .from("platform_users")
      .select("*", { count: "exact", head: true })
      .eq("role", "instructor")
      .lt("created_at", prev30.toISOString());

    const students = await supabase
      .from("platform_users")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    const studentsPrev = await supabase
      .from("platform_users")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")
      .lt("created_at", prev30.toISOString());

    // Get active users (simplified - just use total for now since user_activity might not exist)
    const activeUsersToday = totalUsers.count || 0;
    const activeUsersYesterday = totalUsers.count || 0;

    return {
      totals: {
        users: totalUsers.count || 0,
        active: activeUsersToday,
        instructors: instructors.count || 0,
        students: students.count || 0,
      },
      growth: {
        user: calculateGrowth(totalUsers.count || 0, previousUsers.count || 0),
        active: calculateGrowth(activeUsersToday, activeUsersYesterday),
        instructor: calculateGrowth(
          instructors.count || 0,
          instructorsPrev.count || 0
        ),
        student: calculateGrowth(students.count || 0, studentsPrev.count || 0),
      },
    };
  }

  private async getContentStatsWrapper(supabase: any) {
    const itemController = new AdminItemsController();
    return await itemController.getContentStats(supabase);
  }

  private async getTransactionStats(supabase: any) {
    const now = new Date();
    const last30 = new Date();
    last30.setDate(now.getDate() - 30);

    const prev30 = new Date();
    prev30.setDate(now.getDate() - 60);

    const getTotal = async (from: Date, to: Date): Promise<number> => {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount")
        .gte("created_at", from.toISOString())
        .lt("created_at", to.toISOString());

      if (error) {
        console.error("Transaction fetch error:", error.message);
        return 0;
      }

      return (
        data?.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) ?? 0
      );
    };

    const [currentTotal, prevTotal] = await Promise.all([
      getTotal(last30, now),
      getTotal(prev30, last30),
    ]);

    const growth =
      prevTotal === 0
        ? currentTotal > 0
          ? 100
          : 0
        : Math.round(((currentTotal - prevTotal) / prevTotal) * 100);

    return {
      totalAmount: currentTotal,
      previousAmount: prevTotal,
      growth,
    };
  }

  async updateUser(req: FastifyRequest, res: FastifyReply) {
    try {
      const { userId } = req.params as any;
      const updates = req.body;
      const supabase = getSupabaseAdminClient();

      const { data, error } = await supabase
        .from("platform_users")
        .update(updates)
        .eq("id", userId)
        .select();

      if (error) throw error;

      const channel = getRabbitChannel();
      channel.sendToQueue(
        "admin_activities",
        Buffer.from(
          JSON.stringify({
            action: "user_updated",
            admin_id: (req as any).user.id,
            target_id: userId,
            metadata: updates,
          })
        )
      );

      res.send(data[0]);
    } catch (err) {
      res.status(500).send({
        error: "Failed to update user",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
