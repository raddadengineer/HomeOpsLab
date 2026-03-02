import type { Request, Response } from 'express';
import { topologyService } from '../services/topology.service';

export class TopologyController {
  async getTopology(req: Request, res: Response) {
    try {
      const topology = await topologyService.getTopology();
      res.json(topology);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch topology' });
    }
  }

  async exportTopology(req: Request, res: Response) {
    try {
      const topology = await topologyService.getTopology();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=topology.json');
      res.json(topology);
    } catch (error) {
      res.status(500).json({ error: 'Failed to export topology' });
    }
  }

  async importTopology(req: Request, res: Response) {
    try {
      const { nodes, edges } = req.body;
      const { createdNodes, createdEdges } = await topologyService.importTopology(nodes, edges);

      res.status(201).json({
        nodes: createdNodes,
        edges: createdEdges,
        message: `Imported ${createdNodes.length} nodes and ${createdEdges.length} edges`,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: 'Failed to import topology' });
      }
    }
  }
}

export const topologyController = new TopologyController();
