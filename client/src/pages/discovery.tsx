import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radar, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '@/components/status-badge';

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function DiscoveryPage() {
  const { toast } = useToast();
  const [discoveredNodes, setDiscoveredNodes] = useState<any[]>([]);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  const { data: settingsData } = useQuery<any>({
    queryKey: ['/api/settings'],
  });

  const activeRanges = (settingsData?.networkRanges || []).filter((r: any) => r.enabled);

  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/discovery/scan');
      return res.json();
    },
    onSuccess: (data) => {
      setDiscoveredNodes(data.nodes || []);
      setLastScanTime(data.timestamp);
      toast({
        title: 'Scan Complete',
        description: `Found ${data.nodes?.length || 0} new devices`,
      });
    },
    onError: () => {
      toast({
        title: 'Scan Failed',
        description: 'Failed to complete network discovery sweep',
        variant: 'destructive',
      });
    },
  });

  const addNodeMutation = useMutation({
    mutationFn: async (nodeData: any) => {
      // Create a node without the temporary 'id' from discovery
      const { id, ...payload } = nodeData;
      await apiRequest('POST', '/api/nodes', { ...payload, name: payload.hostname });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/nodes'] });
      setDiscoveredNodes((prev) => prev.filter((n) => n.id !== variables.id));
      toast({ title: 'Device Added', description: 'Device has been added to your inventory' });
    },
    onError: () => {
      toast({
        title: 'Failed to add',
        description: 'Could not add device',
        variant: 'destructive',
      });
    },
  });

  const handleScan = () => {
    scanMutation.mutate();
  };

  const handleDismiss = (nodeId: string) => {
    setDiscoveredNodes((prev) => prev.filter((n) => n.id !== nodeId));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">
            Network Discovery
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Automatically detect devices on your network
          </p>
        </div>
        <Button onClick={handleScan} disabled={scanMutation.isPending} data-testid="button-start-scan">
          <Radar className={`h-4 w-4 mr-2 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
          {scanMutation.isPending ? 'Scanning...' : 'Start Scan'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Network Range</label>
              {activeRanges.length > 0 ? (
                activeRanges.map((r: any) => (
                  <Badge key={r.id} variant="secondary" className="font-mono mr-1">
                    {r.cidr}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No ranges enabled</span>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Scan Method</label>
              <Badge variant="secondary">ICMP Ping Sweep</Badge>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Last Scan</label>
              <Badge variant="secondary">
                {lastScanTime ? formatDistanceToNow(new Date(lastScanTime), { addSuffix: true }) : 'Never'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Discovered Devices ({discoveredNodes.length})
        </h2>

        {discoveredNodes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Radar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No new devices discovered</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start a scan to detect devices on your network
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {discoveredNodes.map(node => (
              <Card key={node.id} className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Radar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{node.hostname}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-muted-foreground font-mono">{node.ip}</p>
                          <StatusBadge status={node.status} />
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <Badge variant="outline">{node.manufacturer}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => addNodeMutation.mutate(node)}
                        disabled={addNodeMutation.isPending}
                        data-testid={`button-add-${node.id}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(node.id)}
                        data-testid={`button-dismiss-${node.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
