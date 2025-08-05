import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

// Roles Table
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Permissions Table
export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: varchar("action", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Role-Permissions Join Table
export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id").references(() => permissions.id, {
    onDelete: "cascade",
  }),
});
