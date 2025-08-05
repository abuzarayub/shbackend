// db/schema/platformUsers.ts
import {
  pgTable,
  varchar,
  uuid,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const platformUsers = pgTable("platform_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  avatarUrl: varchar("avatar_url", { length: 255 }),
  role: varchar("role", { length: 100 }).notNull(),
  learnworldsUser_: varchar("learnworlds_user_"), // ✅ underscore included
  isActive: boolean("is_active").default(true),
  isSuspended: boolean("is_suspended").default(false),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  // Add archived column for soft delete
  archived: boolean("archived").default(false),
  // Add status field for workflow
  status: varchar("status", { length: 20 }).default("draft"),
  // Add school_id foreign key for course-school relationship
  school_id: uuid("school_id"),
});

export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const course_instructors = pgTable(
  "course_instructors",
  {
    course_id: uuid("course_id").notNull(),
    instructor_id: uuid("instructor_id").notNull(),
    // Composite primary key
  },
  (t) => ({
    pk: [t.course_id, t.instructor_id],
  })
);

export const course_bundles = pgTable(
  "course_bundles",
  {
    course_id: uuid("course_id").notNull(),
    bundle_id: uuid("bundle_id").notNull(),
    // Composite primary key
  },
  (t) => ({
    pk: [t.course_id, t.bundle_id],
  })
);
