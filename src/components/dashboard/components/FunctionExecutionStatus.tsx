import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface FunctionExecutionStatusProps {
  loading: string | null;
  onRefreshAll: () => Promise<void>;
}

export function FunctionExecutionStatus({ loading, onRefreshAll }: FunctionExecutionStatusProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Edge Functions Manager</h2>
      <Button
        onClick={onRefreshAll}
        disabled={loading !== null}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${loading === "all" ? "animate-spin" : ""}`} />
        Refresh All
      </Button>
    </div>
  );
}