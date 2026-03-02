import type { Request, Response } from 'express';
import { edgeService } from '../services/edge.service';

export class EdgeController {
  async getAllEdges(req: Request, res: Response) {
    try {
      const edges = await edgeService.getAllEdges();
      res.json(edges);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch edges' });
    }
  }

  async createEdge(req: Request, res: Response) {
    try {
      const edge = await edgeService.createEdge(req.body);
      res.status(201).json(edge);
    } catch (error) {
      res.status(400).json({ error: 'Invalid edge data' });
    }
  }

  async deleteEdge(req: Request, res: Response) {
    try {
      await edgeService.deleteEdge(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete edge' });
    }
  }
}

export const edgeController = new EdgeController();
