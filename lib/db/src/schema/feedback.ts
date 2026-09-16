import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { messagesTable } from "./messages";

export const messageFeedbackTable = pgTable("message_feedback", {
  id: text("id").primaryKey(),
  messageId: text("message_id")
    .notNull()
    .references(() => messagesTable.id, { onDelete: "cascade" }),
  rating: text("rating").notNull(),
  score: integer("score"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMessageFeedbackSchema = createInsertSchema(messageFeedbackTable).omit({
  createdAt: true,
});
export type InsertMessageFeedback = z.infer<typeof insertMessageFeedbackSchema>;
export type MessageFeedback = typeof messageFeedbackTable.$inferSelect;