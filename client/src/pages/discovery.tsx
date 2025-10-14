import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radar, Plus, X } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";

// TODO: Remove mock data
const mockDiscoveredNodes = [
  {
    id: 'd1',
    ip: '192.168.1.100',
    hostname: 'unknown-device-1',
    manufacturer: 'Synology',
    status: 'online' as const,
  },
  {
    id: 'd2',
    ip: '192.168.1.101',
    hostname: 'raspberry-pi',
    manufacturer: 'Raspberry Pi Foundation',
    status: 'online' as const,
  },
  {
    id: 'd3',
    ip: '192.168.1.102',
    hostname: 'unifi-switch',
    manufacturer: 'Ubiquiti',
    status: 'online' as const,
  },
];

export default function DiscoveryPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredNodes, setDiscoveredNodes] = useState(mockDiscoveredNodes);

  const handleScan = () => {
    setIsScanning(true);
    console.log('Starting network scan...');
    setTimeout(() => {
      setIsScanning(false);
      console.log('Scan complete');
    }, 2000);
  };

  const handleAddNode = (nodeId: string) => {
    console.log('Adding node:', nodeId);
    setDiscoveredNodes(prev => prev.filter(n => n.id !== nodeId));
  };

  const handleDismiss = (nodeId: string) => {
    console.log('Dismissing node:', nodeId);
    setDiscoveredNodes(prev => prev.filter(n => n.id !== nodeId));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Network Discovery</h1>
          <p className="text-muted-foreground">Automatically detect devices on your network</p>
        </div>
        <Button 
          onClick={handleScan} 
          disabled={isScanning}
          data-testid="button-start-scan"
        >
          <Radar className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Scanning...' : 'Start Scan'}
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
              <Badge variant="secondary" className="font-mono">192.168.1.0/24</Badge>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Scan Method</label>
              <Badge variant="secondary">ARP + ICMP</Badge>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Last Scan</label>
              <Badge variant="secondary">3 hours ago</Badge>
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
            {discoveredNodes.map((node) => (
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
                        onClick={() => handleAddNode(node.id)}
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
