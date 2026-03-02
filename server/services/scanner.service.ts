import ping from 'ping';
import { nodeService } from './node.service';
import { settingsService } from './settings.service';
import { log } from '../vite'; // or standard logger

// Disable TLS verification for local lab self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Utility to convert CIDR notation (e.g., 192.168.1.0/24) into an array of usable IP addresses
function cidrToIps(cidr: string): string[] {
  try {
    const [ip, maskStr] = cidr.split('/');
    const mask = parseInt(maskStr, 10);
    if (isNaN(mask) || mask < 0 || mask > 32) return [];

    const ipParts = ip.split('.').map(Number);
    if (ipParts.length !== 4 || ipParts.some((p) => isNaN(p) || p < 0 || p > 255)) return [];

    // Convert IP to a 32-bit integer
    const ipNum = ((ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]) >>> 0;

    // Calculate network and broadcast addresses
    const maskNum = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;
    const network = (ipNum & maskNum) >>> 0;
    const broadcast = (network | ~maskNum) >>> 0;

    const ips: string[] = [];
    // Skip network (.0) and broadcast (.255) addresses
    for (let i = network + 1; i < broadcast; i++) {
      ips.push(`${(i >>> 24) & 255}.${(i >>> 16) & 255}.${(i >>> 8) & 255}.${i & 255}`);
    }
    return ips;
  } catch (e) {
    console.error('Failed to parse CIDR:', cidr, e);
    return [];
  }
}

class ScannerService {
  private scanInterval: NodeJS.Timeout | null = null;
  private intervalMs = 60000; // Default 1 minute

  async start(intervalMs?: number) {
    if (intervalMs) {
      this.intervalMs = intervalMs;
    }

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }

    log(`Starting background network scanner (Interval: ${this.intervalMs}ms)`);

    // Run health check immediately, then on interval
    this.scanNetwork();

    this.scanInterval = setInterval(async () => {
      // 1. Health check known nodes
      await this.scanNetwork();

      // 2. See if autoDiscovery is enabled, and try to find new ones
      try {
        const settings = await settingsService.getSettings();
        const scanSettings = settings.scanSettings as { autoDiscovery?: boolean };
        if (scanSettings?.autoDiscovery) {
          await this.discoverNetwork();
        }
      } catch (e) {
        console.error('Failed auto-discovery check', e);
      }
    }, this.intervalMs);
  }

  stop() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
      log('Stopped background network scanner');
    }
  }

  /**
   * Performs a ping sweep across all active network ranges defined in Settings, or a specific CIDR target.
   * @returns an array of newly discovered IPs that are online but not in the DB
   */
  async discoverNetwork(targetCidr?: string): Promise<string[]> {
    try {
      log(`Running background auto-discovery sweep... ${targetCidr ? `(Target: ${targetCidr})` : ''}`);
      const settings = await settingsService.getSettings();
      const networkRanges = (settings.networkRanges || []) as Array<{ cidr: string; enabled: boolean }>;

      const activeRanges = targetCidr
        ? [{ cidr: targetCidr, enabled: true }]
        : networkRanges.filter((r) => r.enabled);

      if (activeRanges.length === 0) return [];

      let allIpsToScan: string[] = [];
      for (const range of activeRanges) {
        allIpsToScan = allIpsToScan.concat(cidrToIps(range.cidr));
      }

      // Filter out IPs we already know about in the DB
      const knownNodes = await nodeService.getAllNodes();
      const knownIps = new Set(knownNodes.map((n) => n.ip).filter(Boolean));

      const unknownIps = allIpsToScan.filter((ip) => !knownIps.has(ip));
      if (unknownIps.length === 0) return [];

      log(`Pinging ${unknownIps.length} unknown IPs...`);
      const newlyDiscovered: string[] = [];

      // Batch the pings so we don't open thousands of processes at once
      const BATCH_SIZE = 50;
      for (let i = 0; i < unknownIps.length; i += BATCH_SIZE) {
        const batch = unknownIps.slice(i, i + BATCH_SIZE);
        const promises = batch.map((ip) => ping.promise.probe(ip, { timeout: 1 }));

        const results = await Promise.allSettled(promises);
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.alive) {
            newlyDiscovered.push(batch[index]);
          }
        });
      }

      if (newlyDiscovered.length > 0) {
        log(`Discovered ${newlyDiscovered.length} new devices!`);
      }
      return newlyDiscovered;
    } catch (error) {
      console.error('Error during auto-discovery:', error);
      return [];
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

          let newStatus = result.alive ? 'online' : 'offline';
          const newUptime = result.alive ? `${result.time}ms` : 'offline';

          // If it is a container with a defined target image, check the docker engine directly!
          if (newStatus === 'online' && node.deviceType === 'container' && node.metadata && 'image' in node.metadata && node.metadata.image) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);
              const dockerRes = await fetch(`http://${node.ip}:2375/containers/json`, { signal: controller.signal });
              clearTimeout(timeoutId);

              if (dockerRes.ok) {
                const containers = await dockerRes.json();
                const metadata = node.metadata as any;
                const isRunning = containers.some((c: any) => c.Image === metadata.image && c.State === 'running');
                if (!isRunning) {
                  newStatus = 'offline';
                }
              }
            } catch (dockerErr) {
              // API probably not open or not docker, fallback to default ICMP alive status.
            }
          }

          let servicesChanged = false;
          const updatedServices = await Promise.all(
            (node.services || []).map(async (service) => {
              if (!service.url || !service.url.startsWith('http')) return service;

              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const res = await fetch(service.url, { method: 'GET', signal: controller.signal });
                clearTimeout(timeoutId);

                const serviceStatus = res.ok || res.status < 400 || res.status === 401 || res.status === 403 ? 'online' : 'offline';
                if (service.status !== serviceStatus) servicesChanged = true;
                return { ...service, status: serviceStatus };
              } catch (err) {
                if (service.status !== 'offline') servicesChanged = true;
                return { ...service, status: 'offline' };
              }
            })
          );

          // Update if status changed
          if (node.status !== newStatus || node.uptime !== newUptime || servicesChanged) {
            await nodeService.updateNode(node.id, {
              status: newStatus,
              uptime: newUptime,
              services: updatedServices,
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
