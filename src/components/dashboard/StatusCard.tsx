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
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
                <h3 className="mt-2 text-xl sm:text-2xl font-bold truncate">{value}</h3>
                {trend && (
                  <p className={cn(
                    "text-sm mt-1",
                    trend.value > 0 ? "text-success" : "text-destructive"
                  )}>
                    {trend.value > 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
                  </p>
                )}
                {indicator && <div className="mt-2">{indicator}</div>}
              </div>
              <div
                className={cn("status-badge flex-shrink-0", {
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
        <HoverCardContent className="w-80 p-4">
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