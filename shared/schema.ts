import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const nodes = pgTable("nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ip: text("ip").notNull(),
  osType: text("os_type").notNull(),
  status: text("status").notNull().default('unknown'),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  serviceUrl: text("service_url"),
  position: jsonb("position").default({ x: 0, y: 0 }),
  uptime: text("uptime"),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const edges = pgTable("edges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: varchar("source").notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  target: varchar("target").notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  animated: text("animated").default('false'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNodeSchema = createInsertSchema(nodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSeen: true,
});

export const insertEdgeSchema = createInsertSchema(edges).omit({
  id: true,
  createdAt: true,
});

export type InsertNode = z.infer<typeof insertNodeSchema>;
export type Node = typeof nodes.$inferSelect;
export type InsertEdge = z.infer<typeof insertEdgeSchema>;
export type Edge = typeof edges.$inferSelect;
