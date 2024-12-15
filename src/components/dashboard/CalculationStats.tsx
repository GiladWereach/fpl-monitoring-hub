import { Calculator, Clock, Activity } from "lucide-react";
import { StatusCard } from "./StatusCard";

interface CalculationStatsProps {
  activeCalculations: number;
  completedToday: number;
  failedToday: number;
}

export function CalculationStats({
  activeCalculations,
  completedToday,
  failedToday,
}: CalculationStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatusCard
        title="Active Calculations"
        value={activeCalculations.toString()}
        status="info"
        icon={<Calculator className="h-4 w-4" />}
      />
      <StatusCard
        title="Completed Today"
        value={completedToday.toString()}
        status="success"
        icon={<Clock className="h-4 w-4" />}
      />
      <StatusCard
        title="Failed Today"
        value={failedToday.toString()}
        status="error"
        icon={<Activity className="h-4 w-4" />}
      />
    </div>
  );
}