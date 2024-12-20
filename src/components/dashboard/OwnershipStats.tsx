import { useQuery } from "@tanstack/react-query";
import { getCurrentOwnership } from "@/lib/ownership";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function OwnershipStats() {
  const { data: ownershipStats, isLoading, error } = useQuery({
    queryKey: ['ownership-stats'],
    queryFn: getCurrentOwnership,
    refetchInterval: 300000, // Refresh every 5 minutes
    retry: 3,
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-4 w-[200px] mb-4" />
        <Skeleton className="h-20" />
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load ownership statistics. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!ownershipStats?.length) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground">No ownership data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Ownership Statistics</h3>
      <div className="space-y-2">
        {ownershipStats[0]?.ownership_data?.map((stat: any) => (
          <div key={stat.player_id} className="flex justify-between">
            <span>{stat.player_name}</span>
            <span>{stat.ownership_percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}