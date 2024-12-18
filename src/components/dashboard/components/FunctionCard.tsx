import { Button } from "@/components/ui/button";
import { Play, RefreshCw } from "lucide-react";
import { ScheduleManager } from "../ScheduleManager";
import { Card } from "@/components/ui/card";

interface FunctionCardProps {
  name: string;
  functionName: string;
  loading: string | null;
  onExecute: (functionName: string) => Promise<void>;
}

export function FunctionCard({ name, functionName, loading, onExecute }: FunctionCardProps) {
  const isLoading = loading === functionName || loading === "all";

  return (
    <Card className="p-4 bg-background">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-semibold truncate">{name}</h3>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExecute(functionName)}
            disabled={loading !== null}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <ScheduleManager
            functionName={functionName}
            functionDisplayName={name}
          />
        </div>
      </div>
    </Card>
  );
}