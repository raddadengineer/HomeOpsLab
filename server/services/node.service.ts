import { storage } from '../storage';
import { insertNodeSchema, updateNodeSchema } from '@shared/schema';
import { settingsService } from './settings.service';

// Utility to check if a specific IP belongs to a CIDR range
function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [networkIp, maskStr] = cidr.split('/');
    const mask = parseInt(maskStr, 10);
    if (isNaN(mask) || mask < 0 || mask > 32) return false;

    const ipParts = ip.split('.').map(Number);
    const networkParts = networkIp.split('.').map(Number);

    if (ipParts.length !== 4 || networkParts.length !== 4) return false;
    if (ipParts.some((p) => isNaN(p) || p < 0 || p > 255)) return false;
    if (networkParts.some((p) => isNaN(p) || p < 0 || p > 255)) return false;

    const ipNum = ((ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]) >>> 0;
    const networkNum = ((networkParts[0] << 24) | (networkParts[1] << 16) | (networkParts[2] << 8) | networkParts[3]) >>> 0;

    const maskNum = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;

    return (ipNum & maskNum) === (networkNum & maskNum);
  } catch (e) {
    return false;
  }
}


export class NodeService {
  async getAllNodes() {
    return await storage.getAllNodes();
  }

  async getNodeById(id: string) {
    return await storage.getNode(id);
  }

  async createNode(data: unknown) {
    const validatedData = insertNodeSchema.parse(data);

    // Auto-Tagging Logic: Check if IP matches any configured VLAN
    if (validatedData.ip) {
      try {
        const settings = await settingsService.getSettings();
        const vlans = (settings.vlans || []) as Array<{ name: string; cidr: string; enabled: boolean }>;

        for (const vlan of vlans) {
          if (vlan.enabled && vlan.cidr && isIpInCidr(validatedData.ip, vlan.cidr)) {
            if (!validatedData.tags) {
              validatedData.tags = [];
            }
            const tagValue = `VLAN: ${vlan.name}`;
            if (!validatedData.tags.includes(tagValue)) {
              validatedData.tags.push(tagValue);
            }
          }
        }
      } catch (error) {
        console.error('Failed to process VLAN auto-tagging:', error);
      }
    }

    return await storage.createNode(validatedData);
  }

  async updateNode(id: string, data: unknown) {
    const validatedData = updateNodeSchema.parse(data);
    return await storage.updateNode(id, validatedData);
  }

  async deleteNode(id: string) {
    await storage.deleteNode(id);
  }

  async deleteNodes(ids: string[]) {
    await storage.deleteNodes(ids);
  }
}

export const nodeService = new NodeService();
