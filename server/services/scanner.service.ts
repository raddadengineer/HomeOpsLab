import ping from 'ping';
import { nodeService } from './node.service';
import { log } from '../vite'; // or standard logger

class ScannerService {
  private scanInterval: NodeJS.Timeout | null = null;
  private intervalMs = 60000; // Default 1 minute

  start(intervalMs?: number) {
    if (intervalMs) {
      this.intervalMs = intervalMs;
    }

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }

    log(`Starting background network scanner (Interval: ${this.intervalMs}ms)`);

    // Run immediately, then on interval
    this.scanNetwork();
    this.scanInterval = setInterval(() => this.scanNetwork(), this.intervalMs);
  }

  stop() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
      log('Stopped background network scanner');
    }
  }

  private async scanNetwork() {
    try {
      log('Running background network scan (Ping Check)...');
      const nodes = await nodeService.getAllNodes();

      for (const node of nodes) {
        if (!node.ip) continue;

        try {
          const result = await ping.promise.probe(node.ip, {
            timeout: 2,
          });

          const newStatus = result.alive ? 'online' : 'offline';
          const newUptime = result.alive ? `${result.time}ms` : 'offline';

          // Update if status changed
          if (node.status !== newStatus || node.uptime !== newUptime) {
            await nodeService.updateNode(node.id, {
              status: newStatus,
              uptime: newUptime,
              lastSeen: new Date(),
            });
          }
        } catch (pingError) {
          console.error(`Failed to ping node ${node.ip}:`, pingError);
        }
      }
    } catch (error) {
      console.error('Error during network scan:', error);
    }
  }
}

export const scannerService = new ScannerService();
