import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNodeSchema, insertEdgeSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Node routes
  app.get("/api/nodes", async (req, res) => {
    try {
      const nodes = await storage.getAllNodes();
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch nodes" });
    }
  });

  app.get("/api/nodes/:id", async (req, res) => {
    try {
      const node = await storage.getNode(req.params.id);
      if (!node) {
        return res.status(404).json({ error: "Node not found" });
      }
      res.json(node);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch node" });
    }
  });

  app.post("/api/nodes", async (req, res) => {
    try {
      const validatedData = insertNodeSchema.parse(req.body);
      const node = await storage.createNode(validatedData);
      res.status(201).json(node);
    } catch (error) {
      res.status(400).json({ error: "Invalid node data" });
    }
  });

  app.put("/api/nodes/:id", async (req, res) => {
    try {
      // Validate and whitelist only updatable fields
      const updateSchema = insertNodeSchema.partial().omit({ position: true });
      const validatedData = updateSchema.parse(req.body);
      
      const node = await storage.updateNode(req.params.id, validatedData);
      if (!node) {
        return res.status(404).json({ error: "Node not found" });
      }
      res.json(node);
    } catch (error) {
      res.status(400).json({ error: "Failed to update node" });
    }
  });

  app.delete("/api/nodes/:id", async (req, res) => {
    try {
      await storage.deleteNode(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete node" });
    }
  });

  // Edge routes
  app.get("/api/edges", async (req, res) => {
    try {
      const edges = await storage.getAllEdges();
      res.json(edges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch edges" });
    }
  });

  app.post("/api/edges", async (req, res) => {
    try {
      const validatedData = insertEdgeSchema.parse(req.body);
      const edge = await storage.createEdge(validatedData);
      res.status(201).json(edge);
    } catch (error) {
      res.status(400).json({ error: "Invalid edge data" });
    }
  });

  app.delete("/api/edges/:id", async (req, res) => {
    try {
      await storage.deleteEdge(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete edge" });
    }
  });

  // Topology route (nodes + edges together)
  app.get("/api/topology", async (req, res) => {
    try {
      const [nodes, edges] = await Promise.all([
        storage.getAllNodes(),
        storage.getAllEdges(),
      ]);
      res.json({ nodes, edges });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch topology" });
    }
  });

  // Export/Import routes
  app.get("/api/export", async (req, res) => {
    try {
      const [nodes, edges] = await Promise.all([
        storage.getAllNodes(),
        storage.getAllEdges(),
      ]);
      const topology = { nodes, edges };
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=topology.json');
      res.json(topology);
    } catch (error) {
      res.status(500).json({ error: "Failed to export topology" });
    }
  });

  app.post("/api/import", async (req, res) => {
    try {
      const { nodes: importNodes, edges: importEdges } = req.body;
      
      if (!importNodes || !Array.isArray(importNodes)) {
        return res.status(400).json({ error: "Invalid import data" });
      }

      // Validate all nodes before importing
      const validatedNodes = importNodes.map(node => insertNodeSchema.parse(node));

      // Validate all edges if provided
      let validatedEdges: any[] = [];
      if (importEdges && Array.isArray(importEdges)) {
        validatedEdges = importEdges.map(edge => insertEdgeSchema.parse(edge));
      }

      // Import nodes
      const createdNodes = await Promise.all(
        validatedNodes.map(node => storage.createNode(node))
      );

      // Import edges with validated data
      const createdEdges = await Promise.all(
        validatedEdges.map(edge => storage.createEdge(edge))
      );

      res.status(201).json({ 
        nodes: createdNodes, 
        edges: createdEdges,
        message: `Imported ${createdNodes.length} nodes and ${createdEdges.length} edges`
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Failed to import topology" });
      }
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
