import { NetworkCanvas } from "@/components/network-canvas";
import { NodeDetailPanel } from "@/components/node-detail-panel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";
import type { Node } from "reactflow";

// TODO: Remove mock data
const mockNodeData = {
  '1': {
    id: '1',
    name: 'Proxmox Server',
    ip: '192.168.1.10',
    osType: 'Proxmox VE',
    status: 'online' as const,
    tags: ['virtual', 'hypervisor'],
    serviceUrl: 'https://proxmox.local',
    uptime: '99.8%',
    lastSeen: '2 min ago'
  },
  '2': {
    id: '2',
    name: 'TrueNAS',
    ip: '192.168.1.20',
    osType: 'TrueNAS Core',
    status: 'online' as const,
    tags: ['storage', 'NAS'],
    uptime: '99.9%',
    lastSeen: '1 min ago'
  },
  '3': {
    id: '3',
    name: 'Docker Host',
    ip: '192.168.1.30',
    osType: 'Ubuntu Server',
    status: 'online' as const,
    tags: ['container', 'docker'],
    uptime: '98.5%',
    lastSeen: '5 min ago'
  },
};

export default function NetworkPage() {
  const [selectedNode, setSelectedNode] = useState<typeof mockNodeData[keyof typeof mockNodeData] | null>(null);

  const handleNodeClick = (node: Node) => {
    const nodeData = mockNodeData[node.id as keyof typeof mockNodeData];
    if (nodeData) {
      setSelectedNode(nodeData);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Network Map</h1>
          <p className="text-sm text-muted-foreground">Interactive topology view</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-import">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" data-testid="button-add-node">
            <Plus className="h-4 w-4 mr-2" />
            Add Node
          </Button>
        </div>
      </div>
      
      <div className="flex-1">
        <NetworkCanvas onNodeClick={handleNodeClick} />
      </div>

      <NodeDetailPanel
        isOpen={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        node={selectedNode || undefined}
      />
    </div>
  );
}
