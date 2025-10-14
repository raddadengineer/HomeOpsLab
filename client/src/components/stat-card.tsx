import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className = "" }: StatCardProps) {
  return (
    <Card className={`${className} hover-elevate transition-all duration-200`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight" data-testid={`text-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        {trend && (
          <p className={`text-sm font-medium ${trend.positive ? 'text-green-400' : 'text-red-400'} mt-2 flex items-center gap-1`}>
            <span className="text-lg">{trend.positive ? '↑' : '↓'}</span>
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
