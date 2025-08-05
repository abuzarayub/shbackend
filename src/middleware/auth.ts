// src/middleware/adminAuth.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { getSupabaseAdminClient } from "../utils/SupaBase";

export async function verifyAdminRole(
  req: FastifyRequest, // TypeScript now knows about req.admin
  reply: FastifyReply
) {
  try {
    if (!req.user) {
      return reply.status(401).send({ error: "Authentication required" });
    }

    // Type guard for admin role
    if (req.user.role !== "admin") {
      return reply.status(403).send({ error: "Admin access required" });
    }

    const supabase = getSupabaseAdminClient();
    const { data: adminUser } = await supabase
      .from("admin_permissions") // Your admin permissions table
      .select("permissions")
      .eq("user_id", req.user.id)
      .single();

    // Add admin properties to request
    req.admin = {
      id: req.user.id,
      permissions: adminUser?.permissions || [], // Default empty array
    };
  } catch (err) {
    console.error("Admin verification error:", err);
    return reply.status(500).send({ error: "Internal server error" });
  }
}
