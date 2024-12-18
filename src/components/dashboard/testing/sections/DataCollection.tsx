import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { CollectionMetrics } from "@/types/metrics";

export function DataCollection() {
  const { data: transferHistory } = useQuery({
    queryKey: ['transfer-history-test'],
    queryFn: async () => {
      console.log('Fetching transfer history for testing...');
      const { data, error } = await supabase
        .from('transfer_history')
        .select(`
          player_id,
          timestamp,
          transfers_in_delta,
          transfers_out_delta,
          ownership_percent,
          players (
            web_name
          )
        `)
        .gt('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    refetchInterval: 300000 // 5 minutes
  });

  const { data: collectionMetrics } = useQuery<CollectionMetrics>({
    queryKey: ['collection-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_collection_metrics', {
          hours_ago: 24
        });
      
      if (error) throw error;
      return data[0];
    }
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Data Collection</h3>
        <div className="space-y-4">
          {transferHistory?.map((record: any) => (
            <div key={`${record.player_id}-${record.timestamp}`} className="flex justify-between items-center p-2 bg-background/50 rounded-lg">
              <div>
                <p className="font-medium">{record.players?.web_name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(record.timestamp), 'MMM d, HH:mm')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">
                  In: {record.transfers_in_delta} | Out: {record.transfers_out_delta}
                </p>
                <p className="text-sm text-muted-foreground">
                  Ownership: {record.ownership_percent}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Collection Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-background/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold">{collectionMetrics?.total_records || 0}</p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Collection Rate</p>
            <p className="text-2xl font-bold">{collectionMetrics?.collection_rate || 0}/hr</p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold">{collectionMetrics?.success_rate || 0}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}