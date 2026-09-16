import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const sessionsTable = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const usersTable = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").notNull().default("customer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const roleChangesTable = pgTable(
  "role_changes",
  {
    id: text("id").primaryKey(),
    actorId: varchar("actor_id").notNull(),
    targetUserId: varchar("target_user_id").notNull(),
    previousRole: text("previous_role").notNull(),
    nextRole: text("next_role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("role_changes_actor_idx").on(table.actorId),
    index("role_changes_target_idx").on(table.targetUserId),
    index("role_changes_created_at_idx").on(table.createdAt),
  ],
);

export type User = typeof usersTable.$inferSelect;
export type RoleChange = typeof roleChangesTable.$inferSelect;