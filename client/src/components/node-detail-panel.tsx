import { X, ExternalLink, Activity, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "./status-badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Service } from "@shared/schema";

interface NodeDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  node?: {
    id: string;
    name: string;
    ip: string;
    osType: string;
    deviceType?: string;
    status: "online" | "offline" | "degraded" | "unknown";
    tags: string[];
    services?: Service[];
    storageTotal?: string;
    storageUsed?: string;
    uptime?: string;
    lastSeen?: string;
  };
}

export function NodeDetailPanel({ isOpen, onClose, onEdit, node }: NodeDetailPanelProps) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/nodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nodes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/topology'] });
      toast({
        title: "Success",
        description: "Node deleted successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete node",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (node && confirm(`Are you sure you want to delete "${node.name}"?`)) {
      deleteMutation.mutate(node.id);
    }
  };

  if (!isOpen || !node) return null;

  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl z-50 overflow-y-auto modern-scrollbar">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold" data-testid="text-node-detail-name">{node.name}</h2>
            <p className="text-sm text-muted-foreground font-mono">{node.ip}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            data-testid="button-close-panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <StatusBadge status={node.status} />
          <Badge variant="outline">{node.osType}</Badge>
        </div>

        <Separator className="my-4" />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-services">Services</TabsTrigger>
            <TabsTrigger value="monitoring" data-testid="tab-monitoring">Monitoring</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {node.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-2">Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">IP Address</dt>
                  <dd className="font-mono">{node.ip}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">OS Type</dt>
                  <dd>{node.osType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Uptime</dt>
                  <dd>{node.uptime || '99.8%'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Last Seen</dt>
                  <dd>{node.lastSeen || '2 min ago'}</dd>
                </div>
              </dl>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4 mt-4">
            {node.services && node.services.length > 0 ? (
              <div className="space-y-2">
                {node.services.map((service, index) => (
                  <Button 
                    key={index}
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => window.open(service.url, '_blank', 'noopener,noreferrer')}
                    data-testid={`button-open-service-${index}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{service.name}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">{service.url}</div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No services configured</p>
            )}
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Health Status</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Response Time</span>
                    <span className="font-mono">12ms</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/4 bg-green-500" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="font-mono">99.8%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-full bg-green-500" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={onEdit}
            data-testid="button-edit-node"
          >
            Edit
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1" 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            data-testid="button-delete-node"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
