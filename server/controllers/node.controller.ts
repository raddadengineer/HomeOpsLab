import type { Request, Response } from 'express';
import { nodeService } from '../services/node.service';
import wol from 'wake_on_lan';

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

  async wakeNode(req: Request, res: Response) {
    try {
      const node = await nodeService.getNodeById(req.params.id);
      if (!node) {
        return res.status(404).json({ error: 'Node not found' });
      }

      const macAddress = typeof node.metadata === 'object' && node.metadata !== null
        ? (node.metadata as any).macAddress
        : null;

      if (!macAddress) {
        return res.status(400).json({ error: 'No MAC address configured for this node' });
      }

      await new Promise<void>((resolve, reject) => {
        wol.wake(macAddress, (error: any) => {
          if (error) {
            console.error('Wake-on-LAN error:', error);
            reject(error);
          } else {
            resolve();
          }
        });
      });

      res.status(200).json({ message: 'Magic packet sent successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send magic packet' });
    }
  }

  async bulkDeleteNodes(req: Request, res: Response) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Array of ids is required' });
      }
      await nodeService.deleteNodes(ids);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to bulk delete nodes' });
    }
  }
}

export const nodeController = new NodeController();
