import { Request, Response } from 'express';
import { scannerService } from '../services/scanner.service';
import { nodeService } from '../services/node.service';
import { settingsService } from '../services/settings.service';

export class DiscoveryController {
    async scanNetwork(_req: Request, res: Response) {
        try {
            // Return a 202 quickly if we wanted async, but we'll wait for the ping sweep for immediate response
            const newlyDiscoveredIps = await scannerService.discoverNetwork();

            // format them into mock node shapes so the UI can display them correctly
            const newlyDiscoveredNodes = newlyDiscoveredIps.map((ip, i) => ({
                id: `discovered-${i}`,
                ip,
                hostname: `Unknown Device (${ip})`,
                manufacturer: 'Generic',
                status: 'online',
                deviceType: 'server',
                osType: 'unknown',
            }));

            // In addition, calculate total nodes scanned for meta info
            const settings = await settingsService.getSettings();
            const scanSettings = settings.scanSettings as any;
            res.json({
                nodes: newlyDiscoveredNodes,
                timestamp: new Date().toISOString(),
                scanSettings
            });
        } catch (error) {
            console.error('Failed to run discovery scan:', error);
            res.status(500).json({ message: 'Discovery scan failed to complete' });
        }
    }
}

export const discoveryController = new DiscoveryController();
