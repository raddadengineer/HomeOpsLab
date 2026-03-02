import type { Request, Response } from 'express';
import { nodeService } from '../services/node.service';

export class NodeController {
  async getAllNodes(req: Request, res: Response) {
    try {
      const nodes = await nodeService.getAllNodes();
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch nodes' });
    }
  }

  async getNode(req: Request, res: Response) {
    try {
      const node = await nodeService.getNodeById(req.params.id);
      if (!node) {
        return res.status(404).json({ error: 'Node not found' });
      }
      res.json(node);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch node' });
    }
  }

  async createNode(req: Request, res: Response) {
    try {
      const node = await nodeService.createNode(req.body);
      res.status(201).json(node);
    } catch (error) {
      res.status(400).json({ error: 'Invalid node data' });
    }
  }

  async updateNode(req: Request, res: Response) {
    try {
      const node = await nodeService.updateNode(req.params.id, req.body);
      if (!node) {
        return res.status(404).json({ error: 'Node not found' });
      }
      res.json(node);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update node' });
    }
  }

  async deleteNode(req: Request, res: Response) {
    try {
      await nodeService.deleteNode(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete node' });
    }
  }
}

export const nodeController = new NodeController();
