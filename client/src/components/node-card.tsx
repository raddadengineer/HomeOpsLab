import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./status-badge";
import { ExternalLink, MoreVertical, Server, Router, Network, Wifi, HardDrive, Box } from "lucide-react";
import type { Service, DeviceMetadata } from "@shared/schema";

interface NodeCardProps {
  id: string;
  name: string;
  ip: string;
  osType: string;
  deviceType?: string;
  status: "online" | "offline" | "degraded" | "unknown";
  tags?: string[];
  services?: Service[];
  storageTotal?: string;
  storageUsed?: string;
  metadata?: DeviceMetadata;
  onClick?: () => void;
  onEdit?: () => void;
}

const getDeviceIcon = (deviceType?: string) => {
  switch (deviceType) {
    case 'router': return Router;
    case 'switch': return Network;
    case 'access-point': return Wifi;
    case 'nas': return HardDrive;
    case 'container': return Box;
    default: return Server;
  }
};

const getDeviceLabel = (deviceType?: string) => {
  switch (deviceType) {
    case 'router': return 'Router';
    case 'switch': return 'Switch';
    case 'access-point': return 'Access Point';
    case 'nas': return 'NAS';
    case 'container': return 'Container';
    default: return 'Server';
  }
};

export function NodeCard({ 
  id, 
  name, 
  ip, 
  osType, 
  deviceType,
  status, 
  tags = [], 
  services = [],
  storageTotal,
  storageUsed,
  metadata,
  onClick,
  onEdit
}: NodeCardProps) {
  const DeviceIcon = getDeviceIcon(deviceType);
  const deviceLabel = getDeviceLabel(deviceType);
  
  // Safely calculate storage percentage with NaN handling
  const storagePercent = storageTotal && storageUsed 
    ? (() => {
        const total = parseFloat(storageTotal);
        const used = parseFloat(storageUsed);
        if (isNaN(total) || isNaN(used) || total <= 0) return null;
        return Math.round((used / total) * 100);
      })()
    : null;

  return (
    <Card 
      className="hover-elevate cursor-pointer transition-all duration-200 group" 
      onClick={onClick}
      data-testid={`card-node-${id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-200">
              <DeviceIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate" data-testid={`text-node-name-${id}`}>{name}</h3>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">{ip}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            data-testid={`button-node-edit-${id}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <StatusBadge status={status} />
          <Badge variant="outline" className="text-xs">{deviceLabel}</Badge>
          <Badge variant="outline" className="text-xs">{osType}</Badge>
        </div>
        {deviceType === 'nas' && storageTotal && storageUsed && storagePercent !== null && (
          <div className="mt-2 p-2 rounded-md bg-muted/50">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Storage</span>
              <span className="font-mono">{storageUsed}/{storageTotal} GB ({storagePercent}%)</span>
            </div>
            <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Device-specific metadata display */}
        {metadata && (
          <div className="mt-2 space-y-1">
            {deviceType === 'router' && 'wanIp' in metadata && (
              <>
                {metadata.wanIp && (
                  <div className="text-xs flex justify-between">
                    <span className="text-muted-foreground">WAN IP:</span>
                    <span className="font-mono">{metadata.wanIp}</span>
                  </div>
                )}
                {metadata.gateway && (
                  <div className="text-xs flex justify-between">
                    <span className="text-muted-foreground">Gateway:</span>
                    <span className="font-mono">{metadata.gateway}</span>
                  </div>
                )}
              </>
            )}
            {deviceType === 'switch' && 'portCount' in metadata && (
              <>
                {metadata.portCount && (
                  <div className="text-xs flex justify-between">
                    <span className="text-muted-foreground">Ports:</span>
                    <span>{metadata.portCount} {'managementType' in metadata && metadata.managementType ? `(${metadata.managementType})` : ''}</span>
                  </div>
                )}
              </>
            )}
            {deviceType === 'access-point' && 'wifiStandard' in metadata && (
              <>
                {metadata.wifiStandard && (
                  <div className="text-xs flex justify-between">
                    <span className="text-muted-foreground">WiFi:</span>
                    <span>{metadata.wifiStandard}</span>
                  </div>
                )}
                {metadata.ssid && (
                  <div className="text-xs flex justify-between">
                    <span className="text-muted-foreground">SSID:</span>
                    <span className="font-mono">{metadata.ssid}</span>
                  </div>
                )}
              </>
            )}
            {deviceType === 'nas' && 'raidType' in metadata && metadata.raidType && (
              <div className="text-xs flex justify-between">
                <span className="text-muted-foreground">RAID:</span>
                <span>{metadata.raidType}</span>
              </div>
            )}
            {deviceType === 'container' && 'runtime' in metadata && (
              <>
                {metadata.runtime && (
                  <div className="text-xs flex justify-between">
                    <span className="text-muted-foreground">Runtime:</span>
                    <span>{metadata.runtime}</span>
                  </div>
                )}
                {metadata.image && (
                  <div className="text-xs flex justify-between">
                    <span className="text-muted-foreground">Image:</span>
                    <span className="font-mono text-xs truncate max-w-[180px]">{metadata.image}</span>
                  </div>
                )}
              </>
            )}
            {deviceType === 'server' && 'cpu' in metadata && (
              <>
                {metadata.cpu && (
                  <div className="text-xs flex justify-between">
                    <span className="text-muted-foreground">CPU:</span>
                    <span className="truncate max-w-[180px]">{metadata.cpu}</span>
                  </div>
                )}
                {metadata.ram && (
                  <div className="text-xs flex justify-between">
                    <span className="text-muted-foreground">RAM:</span>
                    <span>{metadata.ram}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
      {services.length > 0 && (
        <CardFooter className="pt-0 flex-col items-start gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            <span>Services</span>
          </div>
          <div className="w-full flex flex-wrap gap-1.5">
            {services.map((service, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs"
                data-testid={`badge-service-${id}-${index}`}
              >
                {service.name}
              </Badge>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
