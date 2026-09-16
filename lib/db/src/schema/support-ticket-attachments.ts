import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { messageAttachmentsTable } from "./message-attachments";
import { supportTicketsTable } from "./support-tickets";

export const supportTicketAttachmentsTable = pgTable("support_ticket_attachments", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => supportTicketsTable.id, { onDelete: "cascade" }),
  attachmentId: text("attachment_id")
    .notNull()
    .references(() => messageAttachmentsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSupportTicketAttachmentSchema = createInsertSchema(supportTicketAttachmentsTable).omit({
  createdAt: true,
});
export type InsertSupportTicketAttachment = z.infer<typeof insertSupportTicketAttachmentSchema>;
export type SupportTicketAttachment = typeof supportTicketAttachmentsTable.$inferSelect;