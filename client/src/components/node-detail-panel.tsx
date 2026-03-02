import { X, ExternalLink, Activity, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from './status-badge';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Power, Terminal, Edit, Trash2, RefreshCw } from 'lucide-react';
import type { Service, DeviceMetadata, Node } from '@shared/schema';
import { SSHConsole } from './ssh-console';

const STANDARD_METADATA_KEYS = new Set([
  'wanIp', 'gateway', 'dhcpRange', 'portCount', 'portSpeed', 'managementType',
  'vlanSupport', 'wifiStandard', 'ssid', 'channel', 'security', 'raidType',
  'protocols', 'runtime', 'image', 'ports', 'cpu', 'ram', 'platform', 'macAddress'
]);

const getCustomFields = (metadata?: Record<string, any>) => {
  if (!metadata) return [];
  return Object.entries(metadata)
    .filter(([key]) => !STANDARD_METADATA_KEYS.has(key))
    .map(([key, value]) => ({ key, value: String(value) }));
};

interface NodeDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  node?: any;
}

export function NodeDetailPanel({ isOpen, onClose, onEdit, node }: NodeDetailPanelProps) {
  const { toast } = useToast();
  const [showExpandedTerminal, setShowExpandedTerminal] = useState(false);

  const { data: metricsData, isLoading: isMetricsLoading, isError: isMetricsError } = useQuery<any>({
    queryKey: [`/api/nodes/${node?.id}/metrics`],
    enabled: !!node && isOpen,
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/nodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nodes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/topology'] });
      toast({
        title: 'Success',
        description: 'Node deleted successfully',
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete node',
        variant: 'destructive',
      });
    },
  });

  const wakeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('POST', `/api/nodes/${id}/wake`);
    },
    onSuccess: () => {
      toast({
        title: 'Magic Packet Sent',
        description: 'Wake-on-LAN packet broadcasted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Wake-on-LAN Failed',
        description: 'Ensure the node has a valid MAC Address and your network allows WoL broadcasts.',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (node && confirm(`Are you sure you want to delete "${node.name}"?`)) {
      deleteMutation.mutate(node.id);
    }
  };

  if (!isOpen || !node) return null;

  const handleWake = () => {
    wakeMutation.mutate(node.id);
  };

  const customFields = getCustomFields(node.metadata || undefined);

  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl z-50 overflow-y-auto modern-scrollbar">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold" data-testid="text-node-detail-name">
              {node.name}
            </h2>
            <p className="text-sm text-muted-foreground font-mono">{node.ip}</p>
          </div>

          <div className="flex gap-2">
            {node.status === 'offline' && node.metadata && (node.metadata as any).macAddress && (
              <Button variant="outline" size="sm" onClick={handleWake} disabled={wakeMutation.isPending} className="border-primary/50 text-primary hover:bg-primary/10">
                <Power className={`h-4 w-4 mr-1 ${wakeMutation.isPending ? 'animate-pulse' : ''}`} />
                Wake Up
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={onEdit} data-testid="button-edit-node-detail">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-panel">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <StatusBadge status={node.status as 'online' | 'offline' | 'degraded' | 'unknown'} />
          <Badge variant="outline">{node.osType}</Badge>
        </div>

        <Separator className="my-4" />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className={`grid w-full ${node.deviceType === 'server' ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="overview" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-services">
              Services
            </TabsTrigger>
            <TabsTrigger value="monitoring" data-testid="tab-monitoring">
              Monitoring
            </TabsTrigger>
            {node.deviceType === 'server' && (
              <TabsTrigger value="terminal" data-testid="tab-terminal">
                Terminal
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {node.tags.map((tag: string) => (
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
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd>{node.deviceType || 'Standard Node'}</dd>
                </div>
                {node.metadata && (node.metadata as any).macAddress && (
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-muted-foreground">MAC Address</dt>
                    <dd className="font-mono text-xs">{String((node.metadata as any).macAddress)}</dd>
                  </div>
                )}
                {node.storageTotal && node.storageUsed && node.deviceType !== 'nas' && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Storage</dt>
                    <dd className="font-mono">
                      {node.storageUsed}/{node.storageTotal} GB
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Uptime</dt>
                  <dd>{node.uptime || '99.8%'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Last Seen</dt>
                  <dd>{node.lastSeen ? new Date(node.lastSeen).toLocaleString() : '2 min ago'}</dd>
                </div>
              </dl>
            </div>

            {/* Device-specific metadata */}
            {node.metadata && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Device Information</h3>
                <dl className="space-y-2 text-sm">
                  {(node.deviceType === 'router' || node.deviceType === 'gateway') && 'wanIp' in node.metadata && (
                    <>
                      {node.metadata.wanIp && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">WAN IP</dt>
                          <dd className="font-mono">{node.metadata.wanIp}</dd>
                        </div>
                      )}
                      {node.metadata.gateway && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Gateway</dt>
                          <dd className="font-mono">{node.metadata.gateway}</dd>
                        </div>
                      )}
                      {node.metadata.dhcpRange && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">DHCP Range</dt>
                          <dd className="font-mono text-xs">{node.metadata.dhcpRange}</dd>
                        </div>
                      )}
                    </>
                  )}
                  {node.deviceType === 'switch' && 'portCount' in node.metadata && (
                    <>
                      {node.metadata.portCount && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Port Count</dt>
                          <dd>{node.metadata.portCount}</dd>
                        </div>
                      )}
                      {node.metadata.portSpeed && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Port Speed</dt>
                          <dd>{node.metadata.portSpeed}</dd>
                        </div>
                      )}
                      {node.metadata.managementType && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Management</dt>
                          <dd className="capitalize">{node.metadata.managementType}</dd>
                        </div>
                      )}
                      {node.metadata.vlanSupport !== undefined && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">VLAN Support</dt>
                          <dd>{node.metadata.vlanSupport ? 'Yes' : 'No'}</dd>
                        </div>
                      )}
                    </>
                  )}
                  {node.deviceType === 'access-point' && 'wifiStandard' in node.metadata && (
                    <>
                      {node.metadata.wifiStandard && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">WiFi Standard</dt>
                          <dd>{node.metadata.wifiStandard}</dd>
                        </div>
                      )}
                      {node.metadata.ssid && (
                        <div className="flex justify-between items-start">
                          <dt className="text-muted-foreground mt-1">SSID(s)</dt>
                          <dd className="flex flex-col items-end gap-1">
                            {String(node.metadata.ssid).split(',').map(s => s.trim()).map((ssid, i) => (
                              <Badge key={i} variant="outline" className="font-mono text-xs">{ssid}</Badge>
                            ))}
                          </dd>
                        </div>
                      )}
                      {node.metadata.channel && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Channel</dt>
                          <dd>{node.metadata.channel}</dd>
                        </div>
                      )}
                      {node.metadata.security && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Security</dt>
                          <dd>{node.metadata.security}</dd>
                        </div>
                      )}
                    </>
                  )}
                  {node.deviceType === 'nas' && 'raidType' in node.metadata && (
                    <>
                      {node.storageTotal && node.storageUsed && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Storage</dt>
                          <dd className="font-mono">
                            {node.storageUsed}/{node.storageTotal} GB
                          </dd>
                        </div>
                      )}
                      {node.metadata.raidType && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">RAID Type</dt>
                          <dd>{node.metadata.raidType}</dd>
                        </div>
                      )}
                      {node.metadata.protocols && node.metadata.protocols.length > 0 && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Protocols</dt>
                          <dd>{node.metadata.protocols.join(', ')}</dd>
                        </div>
                      )}
                    </>
                  )}
                  {node.deviceType === 'container' && 'runtime' in node.metadata && (
                    <>
                      {node.metadata.runtime && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Runtime</dt>
                          <dd className="capitalize">{node.metadata.runtime}</dd>
                        </div>
                      )}
                      {node.metadata.image && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Image</dt>
                          <dd className="font-mono text-xs">{node.metadata.image}</dd>
                        </div>
                      )}
                      {node.metadata.ports && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Ports</dt>
                          <dd className="font-mono text-xs">{node.metadata.ports}</dd>
                        </div>
                      )}
                    </>
                  )}
                  {node.deviceType === 'server' && 'cpu' in node.metadata && (
                    <>
                      {node.metadata.cpu && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">CPU</dt>
                          <dd className="text-xs">{node.metadata.cpu}</dd>
                        </div>
                      )}
                      {node.metadata.ram && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">RAM</dt>
                          <dd>{node.metadata.ram}</dd>
                        </div>
                      )}
                      {node.metadata.platform && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Platform</dt>
                          <dd>{node.metadata.platform}</dd>
                        </div>
                      )}
                    </>
                  )}
                </dl>
              </div>
            )}

            {/* Custom Variables / Metadata Loop */}
            {customFields.length > 0 && (
              <div className="pt-2">
                <h3 className="text-sm font-semibold mb-2">Custom Attributes</h3>
                <dl className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg border border-border/50">
                  {customFields.map(({ key, value }, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-border/30 last:border-0 gap-1 sm:gap-4">
                      <dt className="text-muted-foreground break-all">{key}</dt>
                      <dd className="font-mono text-right break-all">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-4 mt-4">
            {node.services && node.services.length > 0 ? (
              <div className="space-y-2">
                {node.services.map((service: any, index: number) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => window.open(service.url, '_blank', 'noopener,noreferrer')}
                    data-testid={`button-open-service-${index}`}
                  >
                    <ExternalLink className="h-4 w-4 mt-1 self-start" />
                    <div className="flex-1 text-left flex items-center justify-between">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {service.name}
                          <span
                            className={`h-2 w-2 rounded-full ${service.status === 'online'
                              ? 'bg-green-500'
                              : service.status === 'offline'
                                ? 'bg-red-500'
                                : 'bg-muted-foreground'
                              }`}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate max-w-[220px]">
                          {service.url}
                        </div>
                      </div>
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
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Live System Resources</h3>
              </div>

              {isMetricsLoading && !metricsData ? (
                <div className="text-sm text-muted-foreground animate-pulse text-center py-6">
                  Polling node_exporter metrics on port 9100...
                </div>
              ) : isMetricsError ? (
                <div className="text-sm text-red-500 bg-red-500/10 p-4 rounded-md text-center">
                  Unable to fetch metrics. Ensure Prometheus <b>node_exporter</b> is running on port 9100 at {node.ip}.
                </div>
              ) : metricsData && metricsData.metrics ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Load Average (1m)</span>
                      <span className="font-mono">{metricsData.metrics.load1}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Memory Usage</span>
                      <span className="font-mono">
                        {metricsData.metrics.memory.usedPercent}% ({metricsData.metrics.memory.free} GB Free)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-primary transition-all duration-500 ${Number(metricsData.metrics.memory.usedPercent) > 85 ? 'bg-red-500' : ''}`}
                        style={{ width: `${Math.min(100, Math.max(0, metricsData.metrics.memory.usedPercent))}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Root Disk Usage</span>
                      <span className="font-mono">
                        {metricsData.metrics.disk.usedPercent}% ({metricsData.metrics.disk.free} GB Free)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-primary transition-all duration-500 ${Number(metricsData.metrics.disk.usedPercent) > 85 ? 'bg-red-500' : ''}`}
                        style={{ width: `${Math.min(100, Math.max(0, metricsData.metrics.disk.usedPercent))}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </TabsContent>

          {node.deviceType === 'server' && (
            <TabsContent value="terminal" className="mt-4">
              <SSHConsole
                ip={node.ip}
                onExpandToggle={() => setShowExpandedTerminal(true)}
              />
            </TabsContent>
          )}
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
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Expanded Terminal Overlay Component */}
      <Dialog open={showExpandedTerminal} onOpenChange={setShowExpandedTerminal}>
        <DialogContent className="max-w-[90vw] w-[1400px] p-0 overflow-hidden bg-background border-zinc-800">
          <DialogTitle className="sr-only">Interactive Terminal: {node.name}</DialogTitle>
          <div className="bg-zinc-950 p-4 pb-0 h-[80vh] flex flex-col">
            <SSHConsole
              ip={node.ip}
              isExpanded={true}
              onExpandToggle={() => setShowExpandedTerminal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
