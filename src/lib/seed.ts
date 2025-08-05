import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { logger } from "../utils/Logger";
import dotenv from "dotenv";
dotenv.config();

// 👇 Import your schemas
import {
  roles,
  permissions,
  rolePermissions,
} from "../modules/roles/Roles.Schema";

// ✅ Define schema for IDE autocomplete and Drizzle migration tools (optional but useful)
export const schema = {
  roles,
  permissions,
  rolePermissions,
};

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false, // Required by Supabase
  },
});

export const db = drizzle(pool, { schema }); // 👈 Pass schema here

pool
  .connect()
  .then(() => logger.info("🐘 Drizzle PostgreSQL connected successfully."))
  .catch((err) => {
    logger.error("🔴 PostgreSQL connection failed:", err);
    process.exit(1);
  });
