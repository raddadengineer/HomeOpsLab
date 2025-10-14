import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./status-badge";
import { ExternalLink, MoreVertical } from "lucide-react";
import type { Service } from "@shared/schema";

interface NodeCardProps {
  id: string;
  name: string;
  ip: string;
  osType: string;
  status: "online" | "offline" | "degraded" | "unknown";
  tags?: string[];
  services?: Service[];
  onClick?: () => void;
  onEdit?: () => void;
}

export function NodeCard({ 
  id, 
  name, 
  ip, 
  osType, 
  status, 
  tags = [], 
  services = [],
  onClick,
  onEdit
}: NodeCardProps) {
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
              <ServerIcon className="h-6 w-6 text-primary" />
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
          <Badge variant="outline" className="text-xs">{osType}</Badge>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
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

const ServerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="2" y="6" width="20" height="8" rx="1" />
    <path d="M6 10h.01M6 14h.01" />
  </svg>
);
