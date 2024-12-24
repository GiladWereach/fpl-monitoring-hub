import { StatusCard } from "@/components/dashboard/StatusCard";
import { Database, Activity, AlertTriangle, Server } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

interface StatusCardsGridProps {
  metrics: any[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function StatusCardsGrid({ metrics, isLoading, error }: StatusCardsGridProps) {
  const statusCards = [
    {
      title: "Database Status",
      value: "Connected",
      status: "success" as const,
      icon: <Database className="h-4 w-4" />,
      tooltip: "Current database connection status"
    },
    {
      title: "Edge Functions",
      value: `${metrics?.length || 0} Active`,
      status: "info" as const,
      icon: <Server className="h-4 w-4" />,
      tooltip: "Number of active edge functions"
    },
    {
      title: "System Health",
      value: "Healthy",
      status: "success" as const,
      icon: <Activity className="h-4 w-4" />,
      tooltip: "Overall system health status"
    },
    {
      title: "System Errors",
      value: "0",
      status: "warning" as const,
      icon: <AlertTriangle className="h-4 w-4" />,
      tooltip: "Number of system errors in the last 24 hours"
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => (
          <StatusCard key={index} {...card} />
        ))}
      </div>
    </TooltipProvider>
  );
}