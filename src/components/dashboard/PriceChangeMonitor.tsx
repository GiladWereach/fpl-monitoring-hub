import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, Activity } from "lucide-react";
import { format } from "date-fns";

export function PriceChangeMonitor() {
  const { data: priceChanges } = useQuery({
    queryKey: ['recent-price-changes'],
    queryFn: async () => {
      console.log('Fetching recent price changes');
      const { data, error } = await supabase
        .from('price_changes')
        .select(`
          *,
          players (
            web_name,
            team_id,
            element_type
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching price changes:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 60000 // Refresh every minute
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Price Changes</h3>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {priceChanges?.map((change) => (
            <div
              key={change.id}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {change.new_price > change.old_price ? (
                  <ArrowUpCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4 text-red-500" />
                )}
                <div>
                  <p className="font-medium">{change.players?.web_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(change.timestamp), "MMM d, HH:mm")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={change.new_price > change.old_price ? "default" : "destructive"}>
                  {((change.new_price - change.old_price) / 10).toFixed(1)}m
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Net Transfers: {change.net_transfers}
                </span>
              </div>
            </div>
          ))}
          {!priceChanges?.length && (
            <div className="text-center text-muted-foreground">
              No recent price changes
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}