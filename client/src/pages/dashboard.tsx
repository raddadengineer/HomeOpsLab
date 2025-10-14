import { StatCard } from "@/components/stat-card";
import { NodeCard } from "@/components/node-card";
import { Server, Activity, Network, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { NodeDetailPanel } from "@/components/node-detail-panel";
import { useQuery } from "@tanstack/react-query";
import type { Node } from "@shared/schema";

export default function Dashboard() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const { data: nodes = [], isLoading } = useQuery<Node[]>({
    queryKey: ['/api/nodes'],
  });

  // Calculate stats from real data
  const onlineNodes = nodes.filter(n => n.status === 'online').length;
  const totalNodes = nodes.length;
  const recentNodes = nodes.slice(0, 3);

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2" data-testid="text-page-title">Dashboard</h1>
        <p className="text-lg text-muted-foreground">Overview of your home lab infrastructure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Nodes" 
          value={totalNodes} 
          icon={Server}
        />
        <StatCard 
          title="Online" 
          value={`${onlineNodes}/${totalNodes}`} 
          icon={Activity}
          trend={onlineNodes === totalNodes ? { value: "All up", positive: true } : undefined}
        />
        <StatCard 
          title="Services" 
          value={nodes.filter(n => n.serviceUrl).length} 
          icon={Network}
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
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading nodes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentNodes.map((node) => (
              <NodeCard
                key={node.id}
                id={node.id}
                name={node.name}
                ip={node.ip}
                osType={node.osType}
                status={node.status as "online" | "offline" | "degraded" | "unknown"}
                tags={node.tags}
                serviceUrl={node.serviceUrl || undefined}
                onClick={() => setSelectedNode(node)}
              />
            ))}
          </div>
        )}
      </div>

      <NodeDetailPanel
        isOpen={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        node={selectedNode ? {
          id: selectedNode.id,
          name: selectedNode.name,
          ip: selectedNode.ip,
          osType: selectedNode.osType,
          status: selectedNode.status as "online" | "offline" | "degraded" | "unknown",
          tags: selectedNode.tags,
          serviceUrl: selectedNode.serviceUrl || undefined,
          uptime: selectedNode.uptime || undefined,
          lastSeen: selectedNode.lastSeen ? new Date(selectedNode.lastSeen).toLocaleString() : undefined,
        } : undefined}
      />
    </div>
  );
}
