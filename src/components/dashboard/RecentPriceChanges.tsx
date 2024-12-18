import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { format } from "date-fns";

export function RecentPriceChanges() {
  const { data: changes, isLoading } = useQuery({
    queryKey: ["recent-price-changes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_changes")
        .select(`
          *,
          players (
            web_name,
            team
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return <div>Loading recent changes...</div>;
  }

  const formatPrice = (price: number) => {
    return `£${(price / 10).toFixed(1)}m`;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Price Changes</h3>
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {changes?.map((change) => (
            <div
              key={change.id}
              className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {change.players.web_name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatPrice(change.old_price)} → {formatPrice(change.new_price)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    {change.new_price > change.old_price ? (
                      <ArrowUpIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span className={change.new_price > change.old_price ? "text-green-500" : "text-red-500"}>
                      {Math.abs(change.new_price - change.old_price) / 10}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(change.timestamp), "MMM d, HH:mm")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}