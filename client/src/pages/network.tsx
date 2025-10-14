import { NetworkCanvas } from "@/components/network-canvas";
import { NodeDetailPanel } from "@/components/node-detail-panel";
import { NodeFormDialog } from "@/components/node-form-dialog";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";
import type { Node as FlowNode, Edge as FlowEdge } from "reactflow";
import { useQuery } from "@tanstack/react-query";
import type { Node, Edge } from "@shared/schema";

export default function NetworkPage() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editingNode, setEditingNode] = useState<Node | null>(null);

  const { data: topology, isLoading } = useQuery<{ nodes: Node[], edges: Edge[] }>({
    queryKey: ['/api/topology'],
  });

  // Convert database nodes to React Flow nodes
  const flowNodes = useMemo(() => {
    if (!topology?.nodes) return [];
    return topology.nodes.map(node => ({
      id: node.id,
      type: 'default',
      position: typeof node.position === 'object' && node.position !== null 
        ? (node.position as { x: number, y: number }) 
        : { x: Math.random() * 500, y: Math.random() * 300 },
      data: { label: node.name },
      style: {
        background: 'hsl(var(--card))',
        border: `2px solid ${node.status === 'online' ? 'hsl(var(--primary))' : 'hsl(var(--card-border))'}`,
        borderRadius: '8px',
        padding: '12px',
        color: 'hsl(var(--card-foreground))',
      },
    } as FlowNode));
  }, [topology?.nodes]);

  // Convert database edges to React Flow edges
  const flowEdges = useMemo(() => {
    if (!topology?.edges) return [];
    return topology.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.animated === 'true',
      style: { stroke: 'hsl(var(--primary))' },
    } as FlowEdge));
  }, [topology?.edges]);

  const handleNodeClick = (node: FlowNode) => {
    const dbNode = topology?.nodes.find(n => n.id === node.id);
    if (dbNode) {
      setSelectedNode(dbNode);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'topology.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border flex items-center justify-between gap-4 bg-gradient-to-r from-background to-card/50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Network Map</h1>
          <p className="text-base text-muted-foreground mt-1">Interactive topology view</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-import">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" data-testid="button-export" onClick={handleExport}>
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
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading topology...</p>
          </div>
        ) : (
          <NetworkCanvas 
            initialNodes={flowNodes} 
            initialEdges={flowEdges}
            onNodeClick={handleNodeClick} 
          />
        )}
      </div>

      <NodeDetailPanel
        isOpen={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        onEdit={() => {
          if (selectedNode) {
            setEditingNode(selectedNode);
            setSelectedNode(null);
          }
        }}
        node={selectedNode ? {
          id: selectedNode.id,
          name: selectedNode.name,
          ip: selectedNode.ip,
          osType: selectedNode.osType,
          status: selectedNode.status as "online" | "offline" | "degraded" | "unknown",
          tags: selectedNode.tags,
          services: selectedNode.services,
          uptime: selectedNode.uptime || undefined,
          lastSeen: selectedNode.lastSeen ? new Date(selectedNode.lastSeen).toLocaleString() : undefined,
        } : undefined}
      />

      <NodeFormDialog
        open={!!editingNode}
        onOpenChange={(open) => !open && setEditingNode(null)}
        node={editingNode ? {
          id: editingNode.id,
          name: editingNode.name,
          ip: editingNode.ip,
          osType: editingNode.osType,
          status: editingNode.status,
          tags: editingNode.tags,
          services: editingNode.services,
        } : undefined}
      />
    </div>
  );
}
