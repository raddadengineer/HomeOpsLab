import { StatCard } from "@/components/stat-card";
import { NodeCard } from "@/components/node-card";
import { Server, Activity, Network, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { NodeDetailPanel } from "@/components/node-detail-panel";

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
];

export default function Dashboard() {
  const [selectedNode, setSelectedNode] = useState<typeof mockNodes[0] | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2" data-testid="text-page-title">Dashboard</h1>
        <p className="text-lg text-muted-foreground">Overview of your home lab infrastructure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Nodes" 
          value={12} 
          icon={Server}
          trend={{ value: "2 new", positive: true }}
        />
        <StatCard 
          title="Uptime" 
          value="99.8%" 
          icon={Activity}
        />
        <StatCard 
          title="Services" 
          value={24} 
          icon={Network}
          trend={{ value: "1 down", positive: false }}
        />
        <StatCard 
          title="Storage" 
          value="12.4 TB" 
          icon={HardDrive}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover-elevate transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Network Uptime</span>
                  <span className="font-semibold text-base">99.8%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Services Active</span>
                  <span className="font-semibold text-base">23/24</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-11/12 bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Storage Usage</span>
                  <span className="font-semibold text-base">8.2/12.4 TB</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-300" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-2 rounded-lg hover-elevate transition-all duration-200">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Proxmox Server came online</p>
                  <p className="text-xs text-muted-foreground mt-0.5">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg hover-elevate transition-all duration-200">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Docker Host went offline</p>
                  <p className="text-xs text-muted-foreground mt-0.5">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg hover-elevate transition-all duration-200">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Network scan completed</p>
                  <p className="text-xs text-muted-foreground mt-0.5">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Nodes</h2>
          <Button variant="outline" size="sm" data-testid="button-view-all">
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockNodes.map((node) => (
            <NodeCard
              key={node.id}
              {...node}
              onClick={() => setSelectedNode(node)}
            />
          ))}
        </div>
      </div>

      <NodeDetailPanel
        isOpen={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        node={selectedNode || undefined}
      />
    </div>
  );
}
