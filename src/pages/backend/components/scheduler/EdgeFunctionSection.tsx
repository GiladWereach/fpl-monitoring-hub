import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { EdgeFunctionManager } from "@/components/dashboard/EdgeFunctionManager";
import { ExecutionMetricsDisplay } from "@/components/dashboard/monitoring/ExecutionMetricsDisplay";

interface EdgeFunctionSectionProps {
  onNewFunction: () => void;
}

export function EdgeFunctionSection({ onNewFunction }: EdgeFunctionSectionProps) {
  console.log("Rendering EdgeFunctionSection");
  
  return (
    <Card className="p-6 bg-card space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg sm:text-xl font-semibold">Edge Functions</h2>
        <Button onClick={onNewFunction} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Function
        </Button>
      </div>

      <ExecutionMetricsDisplay functionName="fetch-fixtures" />
      
      <EdgeFunctionManager />
    </Card>
  );
}