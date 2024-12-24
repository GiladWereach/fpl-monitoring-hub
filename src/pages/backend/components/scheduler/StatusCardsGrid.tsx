import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusCardsGridProps {
  metrics: any;
  isLoading: boolean;
  error: Error | null;
}

export function StatusCardsGrid({ metrics, isLoading, error }: StatusCardsGridProps) {
  console.log("Rendering StatusCardsGrid with metrics:", metrics);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4 text-destructive">
        Error loading metrics: {error.message}
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics?.map((metric: any) => (
        <Card key={metric.endpoint} className="p-4">
          <h3 className="font-semibold text-sm mb-2">{metric.endpoint}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Success Rate:</span>
              <span>{metric.success_rate}%</span>
            </div>
            <div className="flex justify-between">
              <span>Response Time:</span>
              <span>{metric.avg_response_time}ms</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}