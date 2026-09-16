import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { conversationsTable } from "./conversations";
import { messagesTable } from "./messages";

export const messageAttachmentsTable = pgTable("message_attachments", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversationsTable.id, { onDelete: "cascade" }),
  messageId: text("message_id")
    .references(() => messagesTable.id, { onDelete: "cascade" }),
  originalFilename: text("original_filename").notNull(),
  mediaType: text("media_type").notNull(),
  size: integer("size").notNull(),
  storageKey: text("storage_key").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMessageAttachmentSchema = createInsertSchema(messageAttachmentsTable).omit({
  createdAt: true,
});
export type InsertMessageAttachment = z.infer<typeof insertMessageAttachmentSchema>;
export type MessageAttachment = typeof messageAttachmentsTable.$inferSelect;