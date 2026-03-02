import { storage } from '../storage';
import { insertNodeSchema, insertEdgeSchema } from '@shared/schema';

export class TopologyService {
  async getTopology() {
    const [nodes, edges] = await Promise.all([storage.getAllNodes(), storage.getAllEdges()]);
    return { nodes, edges };
  }

  async importTopology(importNodes: any, importEdges: any) {
    if (!importNodes || !Array.isArray(importNodes)) {
      throw new Error('Invalid import data: nodes array missing');
    }

    // Validate all nodes before importing
    const validatedNodes = importNodes.map(node => insertNodeSchema.parse(node));

    // Validate all edges if provided
    let validatedEdges: any[] = [];
    if (importEdges && Array.isArray(importEdges)) {
      validatedEdges = importEdges.map(edge => insertEdgeSchema.parse(edge));
    }

    // Import nodes
    const createdNodes = await Promise.all(validatedNodes.map(node => storage.createNode(node)));

    // Import edges with validated data
    const createdEdges = await Promise.all(validatedEdges.map(edge => storage.createEdge(edge)));

    return { createdNodes, createdEdges };
  }
}

export const topologyService = new TopologyService();
