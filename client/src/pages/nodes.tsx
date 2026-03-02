import { NodeCard } from '@/components/node-card';
import { NodeDetailPanel } from '@/components/node-detail-panel';
import { NodeFormDialog } from '@/components/node-form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FilterX, ArrowDownUp, Radar, Loader2, Check, RefreshCw, LayoutGrid, Layers, Download, Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Node, Settings } from '@shared/schema';

export default function NodesPage() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDiscoverDialog, setShowDiscoverDialog] = useState(false);
  const [discoveredNodes, setDiscoveredNodes] = useState<any[]>([]);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'grouped'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [scanTarget, setScanTarget] = useState<string>('all');

  const { data: nodes = [], isLoading } = useQuery<Node[]>({
    queryKey: ['/api/nodes'],
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

  const networkRanges = (settings?.networkRanges || []) as Array<{ cidr: string; enabled: boolean }>;

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await apiRequest('POST', '/api/nodes/bulk-delete', { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nodes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/topology'] });
      setSelectedNodes(new Set());
      toast({
        title: 'Success',
        description: 'Selected nodes deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete selected nodes',
        variant: 'destructive',
      });
    },
  });

  const discoverMutation = useMutation({
    mutationFn: async () => {
      const payload = scanTarget === 'all' ? {} : { networkCidr: scanTarget };
      const res = await apiRequest('POST', '/api/discovery/scan', payload);
      return await res.json();
    },
    onSuccess: (data) => {
      setDiscoveredNodes(data.nodes || []);
      toast({
        title: 'Scan Complete',
        description: `Found ${data.nodes?.length || 0} nodes on the network.`,
      });
    },
    onError: () => {
      toast({
        title: 'Scan Failed',
        description: 'Could not perform network discovery.',
        variant: 'destructive',
      });
    },
  });

  const addDiscoveredNodeMutation = useMutation({
    mutationFn: async (node: any) => {
      await apiRequest('POST', '/api/nodes', {
        name: node.hostname,
        ip: node.ip,
        osType: node.osType || 'Unknown',
        deviceType: node.deviceType || 'server',
        status: node.status || 'online',
        metadata: { discovered: true, manufacturer: node.manufacturer }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nodes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/topology'] });
      toast({
        title: 'Node Added',
        description: 'The discovered device has been added to your lab.',
      });
    },
  });

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedNodes.size} selected nodes?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedNodes));
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `homeopslab-nodes-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: 'Export Successful', description: 'Infrastructure configuration downloaded.' });
    } catch (error) {
      toast({ title: 'Export Failed', description: 'Could not generate backup file.', variant: 'destructive' });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        await apiRequest('POST', '/api/import', json);
        queryClient.invalidateQueries({ queryKey: ['/api/nodes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/topology'] });
        toast({ title: 'Import Successful', description: 'Nodes imported successfully.' });
      } catch (error) {
        toast({ title: 'Import Failed', description: 'Invalid JSON format or server error', variant: 'destructive' });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const filteredNodes = useMemo(() => {
    let result = nodes.filter(node => {
      // 1. Text Search
      const matchesSearch =
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.ip.includes(searchQuery) ||
        node.osType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.tags && node.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      // 2. Status Filter
      const matchesStatus = statusFilter === 'all' || node.status === statusFilter;

      // 3. Type Filter
      const matchesType = typeFilter === 'all' || node.deviceType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });

    // 4. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'ip':
          // Attempt simple IP sorting by last octet (or just string compare for now)
          return a.ip.localeCompare(b.ip, undefined, { numeric: true });
        case 'status':
          return a.status.localeCompare(b.status);
        case 'lastSeen':
          const dateA = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
          const dateB = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
          return dateB - dateA; // Newest first
        default:
          return 0;
      }
    });

    return result;
  }, [nodes, searchQuery, statusFilter, typeFilter, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const groupedNodes = useMemo(() => {
    return filteredNodes.reduce((acc, node) => {
      const g = node.deviceType || 'unknown';
      if (!acc[g]) acc[g] = [];
      acc[g].push(node);
      return acc;
    }, {} as Record<string, Node[]>);
  }, [filteredNodes]);

  const deviceTypeLabels: Record<string, string> = {
    'server': 'Servers',
    'router': 'Routers',
    'switch': 'Switches',
    'access-point': 'Access Points',
    'nas': 'Storage (NAS)',
    'gateway': 'Gateways / Modems',
    'container': 'Containers',
    'unknown': 'Uncategorized'
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">
            Nodes
          </h1>
          <p className="text-lg text-muted-foreground mt-2">Manage all infrastructure nodes</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImport}
          />
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:flex"
            onClick={() => fileInputRef.current?.click()}
            title="Import Configuration"
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:flex mr-1"
            onClick={handleExport}
            title="Export Configuration"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/10 hidden md:flex"
            onClick={() => {
              setShowDiscoverDialog(true);
              if (discoveredNodes.length === 0) {
                discoverMutation.mutate();
              }
            }}
          >
            <Radar className="h-4 w-4 mr-2" />
            Discover Nodes
          </Button>
          <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-node">
            <Plus className="h-4 w-4 mr-2" />
            Add Node
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-card/30 p-3 rounded-xl border border-white/5 glass-card">
        <div className="relative flex-1 w-full min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes, IPs, or tags..."
            className="pl-9 bg-background/50 border-white/10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            data-testid="input-search-nodes"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-background/50 border-white/10" data-testid="select-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="degraded">Degraded</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] bg-background/50 border-white/10" data-testid="select-filter-type">
              <SelectValue placeholder="Device Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="server">Server</SelectItem>
              <SelectItem value="router">Router</SelectItem>
              <SelectItem value="switch">Switch</SelectItem>
              <SelectItem value="access-point">Access Point</SelectItem>
              <SelectItem value="nas">NAS</SelectItem>
              <SelectItem value="gateway">Gateway / Modem</SelectItem>
              <SelectItem value="container">Container</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] bg-background/50 border-white/10" data-testid="select-sort">
              <div className="flex items-center gap-2">
                <ArrowDownUp className="h-3 w-3" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="ip">IP Address</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="lastSeen">Last Seen</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              title="Clear Filters"
              className="text-muted-foreground hover:text-foreground"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}

          <div className="h-6 w-px bg-border/50 mx-1 hidden sm:block" />

          <div className="flex bg-background/50 border border-white/10 rounded-md p-0.5">
            <Button
              variant={viewMode === 'grid' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 h-auto text-xs ${viewMode === 'grid' ? 'shadow-sm' : 'text-muted-foreground'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'grouped' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 h-auto text-xs ${viewMode === 'grouped' ? 'shadow-sm' : 'text-muted-foreground'}`}
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Grouped
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading nodes...</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-300">
              {filteredNodes.map(node => (
                <NodeCard
                  key={node.id}
                  id={node.id}
                  name={node.name}
                  ip={node.ip}
                  osType={node.osType}
                  deviceType={node.deviceType}
                  status={node.status as 'online' | 'offline' | 'degraded' | 'unknown'}
                  tags={node.tags}
                  services={node.services}
                  storageTotal={node.storageTotal || undefined}
                  storageUsed={node.storageUsed || undefined}
                  metadata={node.metadata || undefined}
                  isSelected={selectedNodes.has(node.id)}
                  onSelect={(selected) => {
                    const newSelected = new Set(selectedNodes);
                    if (selected) {
                      newSelected.add(node.id);
                    } else {
                      newSelected.delete(node.id);
                    }
                    setSelectedNodes(newSelected);
                  }}
                  onClick={() => setSelectedNode(node)}
                  onEdit={() => setEditingNode(node)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
              {Object.entries(groupedNodes)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([deviceType, groupNodes]) => (
                  <div key={deviceType}>
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-semibold tracking-tight">{deviceTypeLabels[deviceType] || deviceType}</h3>
                      <Badge variant="secondary" className="rounded-full">{groupNodes.length}</Badge>
                      <div className="h-px flex-1 bg-border/50 ml-2" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {groupNodes.map(node => (
                        <NodeCard
                          key={node.id}
                          id={node.id}
                          name={node.name}
                          ip={node.ip}
                          osType={node.osType}
                          deviceType={node.deviceType}
                          status={node.status as 'online' | 'offline' | 'degraded' | 'unknown'}
                          tags={node.tags}
                          services={node.services}
                          storageTotal={node.storageTotal || undefined}
                          storageUsed={node.storageUsed || undefined}
                          metadata={node.metadata || undefined}
                          isSelected={selectedNodes.has(node.id)}
                          onSelect={(selected) => {
                            const newSelected = new Set(selectedNodes);
                            if (selected) {
                              newSelected.add(node.id);
                            } else {
                              newSelected.delete(node.id);
                            }
                            setSelectedNodes(newSelected);
                          }}
                          onClick={() => setSelectedNode(node)}
                          onEdit={() => setEditingNode(node)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

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
        node={selectedNode || undefined}
      />

      <NodeFormDialog open={showAddDialog} onOpenChange={setShowAddDialog} />

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
              deviceType: editingNode.deviceType,
              status: editingNode.status,
              tags: editingNode.tags,
              services: editingNode.services,
              storageTotal: editingNode.storageTotal || undefined,
              storageUsed: editingNode.storageUsed || undefined,
              metadata: editingNode.metadata || undefined,
            }
            : undefined
        }
      />

      {/* Floating Action Bar for Bulk Operations */}
      {selectedNodes.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-card/90 backdrop-blur-xl border border-border tracking-tight rounded-full shadow-2xl animate-in slide-in-from-bottom-5">
          <span className="text-sm font-medium">
            <span className="text-primary mr-1">{selectedNodes.size}</span>
            nodes selected
          </span>
          <div className="h-4 w-px bg-border mx-2" />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
            className="rounded-full shadow-lg"
            data-testid="button-bulk-delete"
          >
            {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete Selected'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedNodes(new Set())}
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        </div>
      )}

      <Dialog open={showDiscoverDialog} onOpenChange={setShowDiscoverDialog}>
        <DialogContent className="sm:max-w-xl glass-card">
          <DialogHeader>
            <DialogTitle>Network Discovery</DialogTitle>
            <DialogDescription>
              Scanning local subnet for unmanaged devices...
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 pt-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Scan Target:</span>
            <Select value={scanTarget} onValueChange={setScanTarget}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select network to scan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Configured Networks</SelectItem>
                {networkRanges.filter(r => r.enabled).map((range, i) => (
                  <SelectItem key={i} value={range.cidr}>{range.cidr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 py-4 min-h-[200px] max-h-[60vh] overflow-y-auto modern-scrollbar border-t border-border mt-2">
            {discoverMutation.isPending ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="animate-pulse">Broadcasting ARP/Ping Sweep...</p>
              </div>
            ) : discoveredNodes.length > 0 ? (
              <div className="space-y-3">
                {discoveredNodes.map((dNode, i) => {
                  const isAlreadyAdded = nodes.some(n => n.ip === dNode.ip);
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-background/50">
                      <div>
                        <p className="font-semibold text-sm">{dNode.hostname}</p>
                        <p className="font-mono text-xs text-muted-foreground">{dNode.ip}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={isAlreadyAdded ? "ghost" : "secondary"}
                        disabled={isAlreadyAdded || addDiscoveredNodeMutation.isPending}
                        onClick={() => addDiscoveredNodeMutation.mutate(dNode)}
                      >
                        {isAlreadyAdded ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Added
                          </>
                        ) : (
                          'Add to Lab'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <Radar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No new devices found.</p>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-4">
            <Button variant="ghost" onClick={() => setShowDiscoverDialog(false)}>
              Close
            </Button>
            <Button
              onClick={() => discoverMutation.mutate()}
              disabled={discoverMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${discoverMutation.isPending ? 'animate-spin' : ''}`} />
              Rescan Network
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
