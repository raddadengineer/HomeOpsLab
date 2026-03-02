import type { Express } from 'express';
import { createServer, type Server } from 'http';
import nodeRoutes from './routes/node.routes';
import edgeRoutes from './routes/edge.routes';
import topologyRoutes from './routes/topology.routes';
import settingsRoutes from './routes/settings.routes';
import discoveryRoutes from './routes/discovery.routes';
import { authenticateToken } from './middleware/auth.middleware';
import { setupSSHWebSocket } from './controllers/ssh.controller';

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply JWT Auth Middleware to all API routes
  app.use('/api', authenticateToken);

  // Mount modular route handlers
  app.use('/api/nodes', nodeRoutes);
  app.use('/api/edges', edgeRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/discovery', discoveryRoutes);

  // Topology routes are mounted at root /api to maintain the /api/topology and
  // /api/export, /api/import endpoint structure
  app.use('/api', topologyRoutes);

  const httpServer = createServer(app);

  // Attach the interactive SSH stream websocket
  setupSSHWebSocket(httpServer);

  return httpServer;
}
