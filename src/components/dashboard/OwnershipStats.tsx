import { useQuery } from "@tanstack/react-query";
import { getCurrentOwnership } from "@/lib/ownership";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { OwnershipResponse } from "@/types/ownership";

export function OwnershipStats() {
  const { data: ownershipData, isLoading, error } = useQuery<OwnershipResponse>({
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

  if (error || !ownershipData?.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load ownership statistics. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!ownershipData.data.ownership_data?.length) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground">No ownership data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">
        Ownership Statistics (GW{ownershipData.data.event})
      </h3>
      <div className="space-y-2">
        {ownershipData.data.ownership_data.map((stat) => (
          <div key={stat.player_id} className="flex justify-between items-center">
            <span>{stat.player_name}</span>
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">
                Owned: <span className="font-medium text-foreground">{stat.ownership_percentage}%</span>
              </span>
              <span className="text-muted-foreground">
                Captain: <span className="font-medium text-foreground">{stat.captain_percentage}%</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}