import type { Request, Response } from 'express';
import { nodeService } from '../services/node.service';

export class MetricsController {
    async getNodeMetrics(req: Request, res: Response) {
        try {
            const node = await nodeService.getNodeById(req.params.id);
            if (!node) {
                return res.status(404).json({ error: 'Node not found' });
            }

            const ip = node.ip;
            if (!ip) {
                return res.status(400).json({ error: 'Node has no IP assigned' });
            }

            // We attempt to fetch prometheus standard node_exporter metrics
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`http://${ip}:9100/metrics`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                return res.status(502).json({ error: 'Target metrics endpoint unavailable', status: response.status });
            }

            const text = await response.text();

            let memTotal = 0;
            let memFree = 0;
            let load1 = 0;
            let diskTotal = 0;
            let diskFree = 0;

            for (const line of text.split('\n')) {
                if (line.startsWith('node_memory_MemTotal_bytes')) memTotal = Number(line.split(' ')[1]);
                if (line.startsWith('node_memory_MemAvailable_bytes') || line.startsWith('node_memory_MemFree_bytes')) memFree = Number(line.split(' ')[1]);
                if (line.startsWith('node_load1')) load1 = Number(line.split(' ')[1]);
                if (line.startsWith('node_filesystem_size_bytes') && line.includes('mountpoint="/"')) diskTotal = Number(line.split(' ').pop());
                if (line.startsWith('node_filesystem_avail_bytes') && line.includes('mountpoint="/"')) diskFree = Number(line.split(' ').pop());
            }

            // Convert bytes to GB correctly
            const memTotalGb = memTotal / (1024 * 1024 * 1024);
            const memFreeGb = memFree / (1024 * 1024 * 1024);
            const memUsedPct = memTotal > 0 ? ((memTotal - memFree) / memTotal) * 100 : 0;

            const diskTotalGb = diskTotal / (1024 * 1024 * 1024);
            const diskFreeGb = diskFree / (1024 * 1024 * 1024);
            const diskUsedPct = diskTotal > 0 ? ((diskTotal - diskFree) / diskTotal) * 100 : 0;

            res.json({
                metrics: {
                    load1: load1.toFixed(2),
                    memory: {
                        total: memTotalGb.toFixed(2),
                        free: memFreeGb.toFixed(2),
                        usedPercent: memUsedPct.toFixed(1)
                    },
                    disk: {
                        total: diskTotalGb.toFixed(2),
                        free: diskFreeGb.toFixed(2),
                        usedPercent: diskUsedPct.toFixed(1)
                    }
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Metrics fetch error:', error);
            res.status(503).json({ error: 'Connection refused or timeout when polling node_exporter (Port 9100)' });
        }
    }
}

export const metricsController = new MetricsController();
