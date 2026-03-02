import { storage } from '../storage';
import { insertEdgeSchema } from '@shared/schema';

export class EdgeService {
  async getAllEdges() {
    return await storage.getAllEdges();
  }

  async createEdge(data: unknown) {
    const validatedData = insertEdgeSchema.parse(data);
    return await storage.createEdge(validatedData);
  }

  async deleteEdge(id: string) {
    await storage.deleteEdge(id);
  }
}

export const edgeService = new EdgeService();
