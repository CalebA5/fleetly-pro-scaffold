import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const example = pgTable("example", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExampleSchema = createInsertSchema(example).omit({
  id: true,
  createdAt: true,
});

export type InsertExample = z.infer<typeof insertExampleSchema>;
export type Example = typeof example.$inferSelect;
