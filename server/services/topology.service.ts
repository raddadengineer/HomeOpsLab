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

    // Map to track old UUIDs to new UUIDs
    const uuidMap = new Map<string, string>();

    // Import nodes and capture their new UUIDs
    const createdNodes = [];
    for (const nodeData of validatedNodes) {
      // Capture the original ID if it exists in the raw data
      const originalId = importNodes.find((n: any) => n.name === nodeData.name && n.ip === nodeData.ip)?.id;

      const createdNode = await storage.createNode(nodeData);
      createdNodes.push(createdNode);

      if (originalId) {
        uuidMap.set(originalId, createdNode.id);
      }
    }

    // Import edges, remap their source and target to the new node UUIDs
    const createdEdges = [];
    for (const edge of validatedEdges) {
      const newSource = uuidMap.get(edge.source) || edge.source;
      const newTarget = uuidMap.get(edge.target) || edge.target;

      const newEdgeData = {
        ...edge,
        source: newSource,
        target: newTarget,
      };

      const createdEdge = await storage.createEdge(newEdgeData);
      createdEdges.push(createdEdge);
    }

    return { createdNodes, createdEdges };
  }
}

export const topologyService = new TopologyService();
