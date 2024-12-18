import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";
import { format } from "date-fns";

interface PricePrediction {
  id: number;
  player_id: number;
  prediction_type: 'RISE' | 'FALL' | 'STABLE';
  probability: number;
  confidence_score: number;
  earliest_expected: string;
  latest_expected: string;
  factors: {
    transfer_trend: {
      net_transfers: number;
      velocity: number;
      acceleration: number;
    };
    ownership_impact: {
      current_ownership: number;
      ownership_trend: number;
      threshold_distance: number;
    };
    timing_factors: {
      time_since_last_change: number;
      gameweek_position: number;
    };
  };
}

export function PricePredictions() {
  const { data: predictions, isLoading } = useQuery({
    queryKey: ["price-predictions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_predictions")
        .select(`
          *,
          players (
            web_name,
            now_cost,
            selected_by_percent,
            team
          )
        `)
        .is("validated_at", null)
        .order("probability", { ascending: false });

      if (error) throw error;
      
      // Type assertion to handle the JSON factors field
      return (data as unknown as (PricePrediction & {
        players: {
          web_name: string;
          now_cost: number;
          selected_by_percent: string;
          team: number;
        };
      })[]);
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return <div>Loading predictions...</div>;
  }

  const renderConfidenceStars = (score: number) => {
    return "★".repeat(score) + "☆".repeat(5 - score);
  };

  const getPredictionColor = (type: string) => {
    switch (type) {
      case "RISE":
        return "text-green-500";
      case "FALL":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getPredictionIcon = (type: string) => {
    switch (type) {
      case "RISE":
        return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
      case "FALL":
        return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <MinusIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Price Change Predictions</h3>
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {predictions?.map((prediction) => (
            <div
              key={prediction.id}
              className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {prediction.players.web_name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    £{(prediction.players.now_cost / 10).toFixed(1)}m
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    {getPredictionIcon(prediction.prediction_type)}
                    <span
                      className={`font-medium ${getPredictionColor(
                        prediction.prediction_type
                      )}`}
                    >
                      {prediction.probability}%
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {renderConfidenceStars(prediction.confidence_score)}
                  </span>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-sm">
                    {format(new Date(prediction.earliest_expected), "HH:mm")} -{" "}
                    {format(new Date(prediction.latest_expected), "HH:mm")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Expected timeframe
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