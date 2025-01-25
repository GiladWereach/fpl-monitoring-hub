import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface StatusCardProps {
  title: string;
  value: string | number;
  status: "success" | "warning" | "error" | "info";
  icon: React.ReactNode;
  indicator?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  details?: {
    label: string;
    value: string | number;
  }[];
}

export function StatusCard({ 
  title, 
  value, 
  status, 
  icon, 
  indicator,
  trend,
  details 
}: StatusCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Card className="glass-card transition-all duration-200 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between space-x-2">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">{title}</p>
                <h3 className="text-lg font-bold tracking-tight">{value}</h3>
                {trend && (
                  <p className={cn(
                    "text-xs font-medium",
                    trend.value > 0 ? "text-success" : "text-destructive"
                  )}>
                    {trend.value > 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
                  </p>
                )}
                {indicator && <div className="mt-1">{indicator}</div>}
              </div>
              <div
                className={cn("status-badge", {
                  "status-badge-success": status === "success",
                  "status-badge-warning": status === "warning",
                  "status-badge-error": status === "error",
                  "status-badge-info": status === "info",
                })}
              >
                {icon}
              </div>
            </div>
          </CardContent>
        </Card>
      </HoverCardTrigger>
      {details && (
        <HoverCardContent className="w-64">
          <div className="space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{detail.label}</span>
                <span className="text-sm font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );
}