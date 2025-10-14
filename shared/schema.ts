import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  url: z.string().url("Must be a valid URL"),
});

export type Service = z.infer<typeof serviceSchema>;

// Device-specific metadata schemas
export const routerMetadataSchema = z.object({
  wanIp: z.string().optional(),
  gateway: z.string().optional(),
  dhcpRange: z.string().optional(),
}).optional();

export const switchMetadataSchema = z.object({
  portCount: z.string().optional(),
  portSpeed: z.string().optional(),
  managementType: z.enum(['managed', 'unmanaged', 'smart']).optional(),
  vlanSupport: z.boolean().optional(),
}).optional();

export const accessPointMetadataSchema = z.object({
  wifiStandard: z.string().optional(),
  ssid: z.string().optional(),
  channel: z.string().optional(),
  security: z.string().optional(),
}).optional();

export const nasMetadataSchema = z.object({
  raidType: z.string().optional(),
  protocols: z.array(z.string()).optional(),
}).optional();

export const containerMetadataSchema = z.object({
  runtime: z.enum(['docker', 'podman', 'containerd']).optional(),
  image: z.string().optional(),
  ports: z.string().optional(),
}).optional();

export const serverMetadataSchema = z.object({
  cpu: z.string().optional(),
  ram: z.string().optional(),
  platform: z.string().optional(),
}).optional();

export type RouterMetadata = z.infer<typeof routerMetadataSchema>;
export type SwitchMetadata = z.infer<typeof switchMetadataSchema>;
export type AccessPointMetadata = z.infer<typeof accessPointMetadataSchema>;
export type NasMetadata = z.infer<typeof nasMetadataSchema>;
export type ContainerMetadata = z.infer<typeof containerMetadataSchema>;
export type ServerMetadata = z.infer<typeof serverMetadataSchema>;

export type DeviceMetadata = RouterMetadata | SwitchMetadata | AccessPointMetadata | NasMetadata | ContainerMetadata | ServerMetadata;

export const nodes = pgTable("nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ip: text("ip").notNull(),
  osType: text("os_type").notNull(),
  deviceType: text("device_type").notNull().default('server'),
  status: text("status").notNull().default('unknown'),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  services: jsonb("services").notNull().default('[]').$type<Service[]>(),
  storageTotal: text("storage_total"),
  storageUsed: text("storage_used"),
  metadata: jsonb("metadata").$type<DeviceMetadata>(),
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

// Base schema without validation - can be extended
export const baseInsertNodeSchema = createInsertSchema(nodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSeen: true,
}).extend({
  services: z.array(serviceSchema).default([]),
  deviceType: z.enum(['server', 'router', 'switch', 'access-point', 'nas', 'container']).default('server'),
  storageTotal: z.string().optional(),
  storageUsed: z.string().optional(),
  metadata: z.union([
    routerMetadataSchema,
    switchMetadataSchema,
    accessPointMetadataSchema,
    nasMetadataSchema,
    containerMetadataSchema,
    serverMetadataSchema,
  ]).optional(),
});

// Validated schema with storage validation
export const insertNodeSchema = baseInsertNodeSchema.superRefine((data, ctx) => {
  // Strict numeric validation regex - only accepts numbers with optional decimal
  const numericRegex = /^\d+(\.\d+)?$/;
  
  // If device is NAS and storage fields are provided, they must be strictly numeric and non-negative
  if (data.deviceType === 'nas') {
    if (data.storageTotal !== undefined && data.storageTotal !== '') {
      if (!numericRegex.test(data.storageTotal)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['storageTotal'],
          message: "Total storage must be a valid number",
        });
      } else {
        const num = Number(data.storageTotal);
        if (num < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['storageTotal'],
            message: "Total storage must be non-negative",
          });
        }
      }
    }
    if (data.storageUsed !== undefined && data.storageUsed !== '') {
      if (!numericRegex.test(data.storageUsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['storageUsed'],
          message: "Used storage must be a valid number",
        });
      } else {
        const num = Number(data.storageUsed);
        if (num < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['storageUsed'],
            message: "Used storage must be non-negative",
          });
        }
      }
    }
    // Ensure used storage doesn't exceed total storage
    if (data.storageTotal && data.storageUsed && 
        numericRegex.test(data.storageTotal) && numericRegex.test(data.storageUsed)) {
      const total = Number(data.storageTotal);
      const used = Number(data.storageUsed);
      if (used > total) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['storageUsed'],
          message: "Used storage cannot exceed total storage",
        });
      }
    }
  }
});

export const insertEdgeSchema = createInsertSchema(edges).omit({
  id: true,
  createdAt: true,
});

export type InsertNode = z.infer<typeof insertNodeSchema>;
export type Node = typeof nodes.$inferSelect;
export type InsertEdge = z.infer<typeof insertEdgeSchema>;
export type Edge = typeof edges.$inferSelect;
