import { useQuery } from "@tanstack/react-query";
import { getCurrentOwnership } from "@/lib/ownership";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OwnershipStats() {
  const { data: ownershipStats, isLoading } = useQuery({
    queryKey: ['ownership-stats'],
    queryFn: getCurrentOwnership,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-4 w-[200px] mb-4" />
        <Skeleton className="h-20" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Ownership Statistics</h3>
      <div className="space-y-2">
        {ownershipStats?.map((stat: any) => (
          <div key={stat._id} className="flex justify-between">
            <span>{stat.player_name}</span>
            <span>{stat.ownership_percentage}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}