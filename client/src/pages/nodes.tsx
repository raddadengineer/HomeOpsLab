import { NodeCard } from "@/components/node-card";
import { NodeDetailPanel } from "@/components/node-detail-panel";
import { NodeFormDialog } from "@/components/node-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Node } from "@shared/schema";

export default function NodesPage() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);

  const { data: nodes = [], isLoading } = useQuery<Node[]>({
    queryKey: ['/api/nodes'],
  });

  const filteredNodes = nodes.filter(node => 
    node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.ip.includes(searchQuery) ||
    node.osType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">Nodes</h1>
          <p className="text-lg text-muted-foreground mt-2">Manage all infrastructure nodes</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-node">
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

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading nodes...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNodes.map((node) => (
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
                onEdit={() => setEditingNode(node)}
              />
            ))}
          </div>

          {filteredNodes.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No nodes found matching your search</p>
            </div>
          )}
        </>
      )}

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
          serviceUrl: selectedNode.serviceUrl || undefined,
          uptime: selectedNode.uptime || undefined,
          lastSeen: selectedNode.lastSeen ? new Date(selectedNode.lastSeen).toLocaleString() : undefined,
        } : undefined}
      />

      <NodeFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
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
          serviceUrl: editingNode.serviceUrl || undefined,
        } : undefined}
      />
    </div>
  );
}
