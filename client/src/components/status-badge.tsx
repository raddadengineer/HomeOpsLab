import { Badge } from "@/components/ui/badge";

type StatusType = "online" | "offline" | "degraded" | "unknown";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig = {
  online: {
    label: "Online",
    className: "bg-green-500/20 text-green-400 border-green-500/50",
  },
  offline: {
    label: "Offline",
    className: "bg-red-500/20 text-red-400 border-red-500/50",
  },
  degraded: {
    label: "Degraded",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  },
  unknown: {
    label: "Unknown",
    className: "bg-gray-500/20 text-gray-400 border-gray-500/50",
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className}`}
      data-testid={`badge-status-${status}`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {config.label}
    </Badge>
  );
}
