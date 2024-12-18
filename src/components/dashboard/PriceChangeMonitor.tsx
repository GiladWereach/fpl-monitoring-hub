import { Card } from "@/components/ui/card";
import { PricePredictions } from "./PricePredictions";
import { RecentPriceChanges } from "./RecentPriceChanges";

export function PriceChangeMonitor() {
  return (
    <div className="space-y-6">
      <PricePredictions />
      <RecentPriceChanges />
    </div>
  );
}