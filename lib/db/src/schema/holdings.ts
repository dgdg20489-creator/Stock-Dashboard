import { pgTable, serial, integer, text, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const holdingsTable = pgTable("holdings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  ticker: text("ticker").notNull(),
  stockName: text("stock_name").notNull(),
  shares: numeric("shares", { precision: 18, scale: 4 }).notNull(),
  avgPrice: numeric("avg_price", { precision: 18, scale: 2 }).notNull(),
});

export const insertHoldingSchema = createInsertSchema(holdingsTable).omit({
  id: true,
});

export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Holding = typeof holdingsTable.$inferSelect;
