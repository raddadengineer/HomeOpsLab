import { NetworkCanvas } from '@/components/network-canvas';
import { NodeDetailPanel } from '@/components/node-detail-panel';
import { NodeFormDialog } from '@/components/node-form-dialog';
import { useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Node as FlowNode, Edge as FlowEdge } from 'reactflow';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import type { Node, Edge } from '@shared/schema';

export default function NetworkPage() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: topology, isLoading } = useQuery<{ nodes: Node[]; edges: Edge[] }>({
    queryKey: ['/api/topology'],
  });

  // Convert database nodes to React Flow nodes
  const flowNodes = useMemo(() => {
    if (!topology?.nodes) return [];
    return topology.nodes.map(
      node =>
        ({
          id: node.id,
          type: 'default',
          position:
            typeof node.position === 'object' && node.position !== null
              ? (node.position as { x: number; y: number })
              : { x: Math.random() * 500, y: Math.random() * 300 },
          data: { label: node.name },
          style: {
            background: 'hsl(var(--card))',
            border: `2px solid ${node.status === 'online' ? 'hsl(var(--primary))' : 'hsl(var(--card-border))'}`,
            borderRadius: '8px',
            padding: '12px',
            color: 'hsl(var(--card-foreground))',
          },
        }) as FlowNode
    );
  }, [topology?.nodes]);

  // Convert database edges to React Flow edges
  const flowEdges = useMemo(() => {
    if (!topology?.edges) return [];
    return topology.edges.map(
      edge =>
        ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          animated: edge.animated === 'true',
          style: { stroke: 'hsl(var(--primary))' },
        }) as FlowEdge
    );
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
      toast({ title: 'Export Failed', description: String(error), variant: 'destructive' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/topology'] });

      toast({
        title: 'Import Successful',
        description: 'Topology topology successfully imported into the map.',
      });
    } catch (error) {
      console.error('Import failed:', error);
      toast({ title: 'Import Failed', description: String(error), variant: 'destructive' });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border flex items-center justify-between gap-4 bg-gradient-to-r from-background to-card/50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Network Map
          </h1>
          <p className="text-base text-muted-foreground mt-1">Interactive topology view</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={handleImportClick} data-testid="button-import">
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
        node={
          selectedNode
            ? {
              id: selectedNode.id,
              name: selectedNode.name,
              ip: selectedNode.ip,
              osType: selectedNode.osType,
              status: selectedNode.status as 'online' | 'offline' | 'degraded' | 'unknown',
              tags: selectedNode.tags,
              services: selectedNode.services,
              uptime: selectedNode.uptime || undefined,
              lastSeen: selectedNode.lastSeen
                ? new Date(selectedNode.lastSeen).toLocaleString()
                : undefined,
            }
            : undefined
        }
      />

      <NodeFormDialog
        open={!!editingNode}
        onOpenChange={open => !open && setEditingNode(null)}
        node={
          editingNode
            ? {
              id: editingNode.id,
              name: editingNode.name,
              ip: editingNode.ip,
              osType: editingNode.osType,
              status: editingNode.status,
              tags: editingNode.tags,
              services: editingNode.services,
            }
            : undefined
        }
      />
    </div>
  );
}
