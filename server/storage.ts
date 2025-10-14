import { type Node, type InsertNode, type Edge, type InsertEdge } from "@shared/schema";
import { db } from "./db";
import { nodes, edges } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Node operations
  getAllNodes(): Promise<Node[]>;
  getNode(id: string): Promise<Node | undefined>;
  createNode(node: InsertNode): Promise<Node>;
  updateNode(id: string, node: Partial<InsertNode>): Promise<Node | undefined>;
  deleteNode(id: string): Promise<void>;
  
  // Edge operations
  getAllEdges(): Promise<Edge[]>;
  getEdge(id: string): Promise<Edge | undefined>;
  createEdge(edge: InsertEdge): Promise<Edge>;
  deleteEdge(id: string): Promise<void>;
}

export class DbStorage implements IStorage {
  // Node operations
  async getAllNodes(): Promise<Node[]> {
    return await db.select().from(nodes);
  }

  async getNode(id: string): Promise<Node | undefined> {
    const result = await db.select().from(nodes).where(eq(nodes.id, id));
    return result[0];
  }

  async createNode(insertNode: InsertNode): Promise<Node> {
    const result = await db.insert(nodes).values(insertNode).returning();
    return result[0];
  }

  async updateNode(id: string, updateData: Partial<InsertNode>): Promise<Node | undefined> {
    const result = await db
      .update(nodes)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(nodes.id, id))
      .returning();
    return result[0];
  }

  async deleteNode(id: string): Promise<void> {
    await db.delete(nodes).where(eq(nodes.id, id));
  }

  // Edge operations
  async getAllEdges(): Promise<Edge[]> {
    return await db.select().from(edges);
  }

  async getEdge(id: string): Promise<Edge | undefined> {
    const result = await db.select().from(edges).where(eq(edges.id, id));
    return result[0];
  }

  async createEdge(insertEdge: InsertEdge): Promise<Edge> {
    const result = await db.insert(edges).values(insertEdge).returning();
    return result[0];
  }

  async deleteEdge(id: string): Promise<void> {
    await db.delete(edges).where(eq(edges.id, id));
  }
}

export const storage = new DbStorage();
