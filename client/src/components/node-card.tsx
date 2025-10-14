import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./status-badge";
import { ExternalLink, MoreVertical } from "lucide-react";

interface NodeCardProps {
  id: string;
  name: string;
  ip: string;
  osType: string;
  status: "online" | "offline" | "degraded" | "unknown";
  tags?: string[];
  serviceUrl?: string;
  onClick?: () => void;
}

export function NodeCard({ 
  id, 
  name, 
  ip, 
  osType, 
  status, 
  tags = [], 
  serviceUrl,
  onClick 
}: NodeCardProps) {
  return (
    <Card 
      className="hover-elevate cursor-pointer" 
      onClick={onClick}
      data-testid={`card-node-${id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ServerIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate" data-testid={`text-node-name-${id}`}>{name}</h3>
              <p className="text-xs text-muted-foreground font-mono">{ip}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Node menu clicked', id);
            }}
            data-testid={`button-node-menu-${id}`}
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
      {serviceUrl && (
        <CardFooter className="pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Opening service URL:', serviceUrl);
            }}
            data-testid={`button-node-service-${id}`}
          >
            <ExternalLink className="h-3 w-3" />
            Open Service
          </Button>
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
