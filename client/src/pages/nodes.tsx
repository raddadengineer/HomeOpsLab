import { NodeCard } from "@/components/node-card";
import { NodeDetailPanel } from "@/components/node-detail-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

// TODO: Remove mock data
const mockNodes = [
  {
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
  {
    id: '2',
    name: 'TrueNAS Storage',
    ip: '192.168.1.20',
    osType: 'TrueNAS Core',
    status: 'online' as const,
    tags: ['storage', 'NAS'],
    uptime: '99.9%',
    lastSeen: '1 min ago'
  },
  {
    id: '3',
    name: 'Docker Host',
    ip: '192.168.1.30',
    osType: 'Ubuntu Server',
    status: 'offline' as const,
    tags: ['container', 'docker'],
    uptime: '95.2%',
    lastSeen: '1 hour ago'
  },
  {
    id: '4',
    name: 'Unraid Server',
    ip: '192.168.1.40',
    osType: 'Unraid',
    status: 'online' as const,
    tags: ['storage', 'media'],
    serviceUrl: 'https://unraid.local',
    uptime: '99.5%',
    lastSeen: '5 min ago'
  },
  {
    id: '5',
    name: 'Pi-hole DNS',
    ip: '192.168.1.50',
    osType: 'Raspberry Pi OS',
    status: 'online' as const,
    tags: ['dns', 'network'],
    serviceUrl: 'https://pihole.local',
    uptime: '100%',
    lastSeen: '1 min ago'
  },
  {
    id: '6',
    name: 'Home Assistant',
    ip: '192.168.1.60',
    osType: 'Home Assistant OS',
    status: 'online' as const,
    tags: ['automation', 'smart-home'],
    serviceUrl: 'https://homeassistant.local',
    uptime: '99.7%',
    lastSeen: '3 min ago'
  },
];

export default function NodesPage() {
  const [selectedNode, setSelectedNode] = useState<typeof mockNodes[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNodes = mockNodes.filter(node => 
    node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.ip.includes(searchQuery) ||
    node.osType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Nodes</h1>
          <p className="text-muted-foreground">Manage all infrastructure nodes</p>
        </div>
        <Button data-testid="button-add-node">
          <Plus className="h-4 w-4 mr-2" />
          Add Node
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search nodes..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-nodes"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNodes.map((node) => (
          <NodeCard
            key={node.id}
            {...node}
            onClick={() => setSelectedNode(node)}
          />
        ))}
      </div>

      {filteredNodes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No nodes found matching your search</p>
        </div>
      )}

      <NodeDetailPanel
        isOpen={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        node={selectedNode || undefined}
      />
    </div>
  );
}
