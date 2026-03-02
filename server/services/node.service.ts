import { storage } from '../storage';
import { insertNodeSchema, updateNodeSchema } from '@shared/schema';

export class NodeService {
  async getAllNodes() {
    return await storage.getAllNodes();
  }

  async getNodeById(id: string) {
    return await storage.getNode(id);
  }

  async createNode(data: unknown) {
    const validatedData = insertNodeSchema.parse(data);
    return await storage.createNode(validatedData);
  }

  async updateNode(id: string, data: unknown) {
    const validatedData = updateNodeSchema.parse(data);
    return await storage.updateNode(id, validatedData);
  }

  async deleteNode(id: string) {
    await storage.deleteNode(id);
  }
}

export const nodeService = new NodeService();
