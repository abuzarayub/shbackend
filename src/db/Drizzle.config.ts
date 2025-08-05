import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { logger } from "../utils/Logger";
import dotenv from "dotenv";
dotenv.config();
// import all platformUsers-related tables
import {
  platformUsers,
  schools,
  course_instructors,
  course_bundles,
} from "../db/platform_users";

// 👇 Import your schemas
import {
  roles,
  permissions,
  rolePermissions,
} from "../modules/roles/Roles.Schema";
import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

// Enrollment table schema - Updated to match real database
export const enrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id"),
  product_id: uuid("product_id"),
  status: varchar("status", { length: 32 }).notNull(),
  enrolled_at: timestamp("enrolled_at", { mode: "string" }),
  course_id: uuid("course_id"),
});

export const progress = pgTable("progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id"),
  course_id: uuid("course_id"),
  progress: varchar("progress", { length: 16 }),
  updated_at: timestamp("updated_at", { mode: "string" }),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  amount: varchar("amount", { length: 32 }).notNull(), // Store as string for now
  status: varchar("status", { length: 32 }).notNull(),
  created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
  updated_at: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const user_subscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  started_at: timestamp("started_at", { mode: "string" }).defaultNow(),
  ended_at: timestamp("ended_at", { mode: "string" }),
  created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
  updated_at: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 64 }).notNull(),
  discount: varchar("discount", { length: 16 }).notNull(), // Store as string for now
  status: varchar("status", { length: 32 }).notNull(),
  created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
  updated_at: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  instructor_id: uuid("instructor_id").notNull(),
  amount: varchar("amount", { length: 32 }).notNull(), // Store as string for now
  status: varchar("status", { length: 32 }).notNull(),
  created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
  updated_at: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  product_id: uuid("product_id").notNull(),
  rating: varchar("rating", { length: 8 }).notNull(), // Store as string for now
  content: varchar("content", { length: 1024 }).notNull(),
  created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
  updated_at: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const community_posts = pgTable("community_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  space_id: uuid("space_id").notNull(),
  content: varchar("content", { length: 2048 }).notNull(),
  created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
  updated_at: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
  updated_at: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const space_members = pgTable("space_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  space_id: uuid("space_id").notNull(),
  user_id: uuid("user_id").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  joined_at: timestamp("joined_at", { mode: "string" }).defaultNow(),
});

export const team_plans = pgTable("team_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  owner_id: uuid("owner_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  details: varchar("details", { length: 2048 }),
  created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
  updated_at: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const team_plan_members = pgTable("team_plan_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  team_plan_id: uuid("team_plan_id").notNull(),
  user_id: uuid("user_id").notNull(),
  role: varchar("role", { length: 64 }).notNull(),
  joined_at: timestamp("joined_at", { mode: "string" }).defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  content: varchar("content", { length: 2048 }),
  read: varchar("read", { length: 8 }).notNull(),
  created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
});

export const action_logs = pgTable("action_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  admin_id: uuid("admin_id").notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  details: varchar("details", { length: 2048 }),
  created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
});

export const application_errors = pgTable("application_errors", {
  id: uuid("id").primaryKey().defaultRandom(),
  error: varchar("error", { length: 1024 }).notNull(),
  context: varchar("context", { length: 2048 }),
  occurred_at: timestamp("occurred_at", { mode: "string" }).defaultNow(),
});

export const platform_settings = pgTable("platform_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 128 }).notNull(),
  value: varchar("value", { length: 2048 }).notNull(),
  updated_at: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

// ✅ Define schema for IDE autocomplete and Drizzle migration tools (optional but useful)
export const schema = {
  roles,
  permissions,
  rolePermissions,
  enrollments, // <-- Add enrollments to schema
  progress, // <-- Add progress to schema
  transactions,
  user_subscriptions,
  coupons,
  payouts,
  reviews,
  community_posts,
  collections,
  space_members,
  team_plans,
  team_plan_members,
  notifications,
  action_logs,
  application_errors,
  platform_settings,
  platformUsers,
  schools,
  course_instructors,
  course_bundles,
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
