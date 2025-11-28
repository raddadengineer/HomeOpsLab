import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { HardDrive, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { NodeFormDialog } from "@/components/node-form-dialog";
import type { Node } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { toast } = useToast();
  const [nasDialogOpen, setNasDialogOpen] = useState(false);
  const [editingNas, setEditingNas] = useState<Node | null>(null);
  const [deleteNasId, setDeleteNasId] = useState<string | null>(null);

  const { data: nodes = [], isLoading } = useQuery<Node[]>({
    queryKey: ['/api/nodes'],
  });

  const nasDevices = nodes.filter(n => n.deviceType === 'nas');

  const totalStorage = nasDevices.reduce((acc, n) => {
    const val = parseFloat(n.storageTotal || '0');
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const usedStorage = nasDevices.reduce((acc, n) => {
    const val = parseFloat(n.storageUsed || '0');
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const storagePercent = totalStorage > 0 ? Math.round((usedStorage / totalStorage) * 100) : 0;

  const formatStorage = (gb: number): string => {
    if (gb >= 1000) {
      const tb = gb / 1000;
      return tb % 1 === 0 ? `${tb} TB` : `${tb.toFixed(1)} TB`;
    }
    return gb % 1 === 0 ? `${gb} GB` : `${gb.toFixed(1)} GB`;
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/nodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nodes'] });
      toast({
        title: "NAS Removed",
        description: "The NAS device has been removed from your storage configuration",
      });
      setDeleteNasId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove NAS device",
        variant: "destructive",
      });
    },
  });

  const handleAddNas = () => {
    setEditingNas(null);
    setNasDialogOpen(true);
  };

  const handleEditNas = (nas: Node) => {
    setEditingNas(nas);
    setNasDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">Settings</h1>
        <p className="text-lg text-muted-foreground mt-2">Configure your HomeOps Lab instance</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Storage Configuration</CardTitle>
                <CardDescription>Manage your NAS devices and storage capacity</CardDescription>
              </div>
            </div>
            <Button onClick={handleAddNas} size="sm" data-testid="button-add-nas">
              <Plus className="h-4 w-4 mr-2" />
              Add NAS
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Storage Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Storage Capacity</span>
              <span className="text-lg font-bold" data-testid="text-total-storage">
                {totalStorage > 0 ? `${formatStorage(usedStorage)} / ${formatStorage(totalStorage)}` : 'No NAS configured'}
              </span>
            </div>
            {totalStorage > 0 && (
              <>
                <Progress value={storagePercent} className="h-3" data-testid="progress-storage" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{nasDevices.length} NAS device{nasDevices.length !== 1 ? 's' : ''}</span>
                  <span className={storagePercent > 80 ? 'text-red-400' : storagePercent > 60 ? 'text-yellow-400' : 'text-green-400'}>
                    {storagePercent}% used
                  </span>
                </div>
              </>
            )}
          </div>

          {/* NAS Device List */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading NAS devices...</div>
          ) : nasDevices.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <HardDrive className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No NAS devices configured</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Add a NAS to start tracking your storage</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">NAS Devices</Label>
              {nasDevices.map((nas) => {
                const nasTotal = parseFloat(nas.storageTotal || '0');
                const nasUsed = parseFloat(nas.storageUsed || '0');
                const nasPercent = nasTotal > 0 ? Math.round((nasUsed / nasTotal) * 100) : 0;
                
                return (
                  <div 
                    key={nas.id} 
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover-elevate transition-all"
                    data-testid={`card-nas-${nas.id}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <HardDrive className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate" data-testid={`text-nas-name-${nas.id}`}>{nas.name}</span>
                        <Badge variant="outline" className="text-xs">{nas.ip}</Badge>
                        <Badge 
                          variant={nas.status === 'online' ? 'default' : 'secondary'}
                          className={`text-xs ${nas.status === 'online' ? 'bg-green-500/20 text-green-400' : ''}`}
                        >
                          {nas.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Progress value={nasPercent} className="h-2" />
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {nasTotal > 0 ? `${formatStorage(nasUsed)} / ${formatStorage(nasTotal)}` : 'No storage data'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditNas(nas)}
                        data-testid={`button-edit-nas-${nas.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setDeleteNasId(nas.id)}
                        data-testid={`button-delete-nas-${nas.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Network Configuration</CardTitle>
          <CardDescription>Configure network scanning and discovery settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="network-range">Network Range</Label>
            <Input 
              id="network-range" 
              placeholder="192.168.1.0/24" 
              defaultValue="192.168.1.0/24"
              data-testid="input-network-range"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scan-interval">Scan Interval (minutes)</Label>
            <Input 
              id="scan-interval" 
              type="number" 
              placeholder="60" 
              defaultValue="60"
              data-testid="input-scan-interval"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Discovery</Label>
              <p className="text-sm text-muted-foreground">Automatically scan for new devices</p>
            </div>
            <Switch defaultChecked data-testid="switch-auto-discovery" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monitoring</CardTitle>
          <CardDescription>Configure health checks and monitoring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="check-interval">Health Check Interval (seconds)</Label>
            <Input 
              id="check-interval" 
              type="number" 
              placeholder="30" 
              defaultValue="30"
              data-testid="input-check-interval"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Alerts</Label>
              <p className="text-sm text-muted-foreground">Send email when nodes go offline</p>
            </div>
            <Switch data-testid="switch-email-alerts" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Backup and export your topology data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-export-json">
              Export as JSON
            </Button>
            <Button variant="outline" data-testid="button-export-yaml">
              Export as YAML
            </Button>
          </div>
          <Separator />
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-import-topology">
              Import Topology
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" data-testid="button-reset">Reset to Defaults</Button>
        <Button data-testid="button-save-settings">Save Settings</Button>
      </div>

      {/* NAS Form Dialog */}
      <NodeFormDialog
        open={nasDialogOpen}
        onOpenChange={setNasDialogOpen}
        node={editingNas ? {
          id: editingNas.id,
          name: editingNas.name,
          ip: editingNas.ip,
          osType: editingNas.osType,
          deviceType: editingNas.deviceType,
          status: editingNas.status,
          tags: editingNas.tags,
          services: editingNas.services || undefined,
          storageTotal: editingNas.storageTotal || undefined,
          storageUsed: editingNas.storageUsed || undefined,
          metadata: editingNas.metadata || undefined,
        } : {
          id: '',
          name: '',
          ip: '',
          osType: 'TrueNAS',
          deviceType: 'nas',
          status: 'online',
          tags: [],
          services: [],
          storageTotal: '',
          storageUsed: '',
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteNasId} onOpenChange={() => setDeleteNasId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove NAS Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this NAS device? This will remove it from your storage tracking.
              The device itself will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteNasId && deleteMutation.mutate(deleteNasId)}
              className="bg-red-500 hover:bg-red-600"
              data-testid="button-confirm-delete"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
