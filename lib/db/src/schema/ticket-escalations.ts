import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { supportTicketsTable } from "./support-tickets";

/**
 * Tracks every escalation step for a support ticket.
 * Each row is an immutable audit entry showing when and why
 * a ticket moved between levels (AI → L1 → L2 → I.S.).
 */
export const ticketEscalationsTable = pgTable("ticket_escalations", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => supportTicketsTable.id, { onDelete: "cascade" }),
  fromLevel: integer("from_level"),
  toLevel: integer("to_level").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  actor: text("actor").notNull(), // "ai" | "human_reviewer" | "l2_reviewer" | "super_admin" | "system"
  actorName: text("actor_name"),  // Display name
  reason: text("reason"),
  resolution: text("resolution"),
  slaDeadline: timestamp("sla_deadline", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TicketEscalation = typeof ticketEscalationsTable.$inferSelect;
