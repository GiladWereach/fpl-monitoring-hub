import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FunctionExecutionStatusProps {
  loading: boolean;
  onRefreshAll: () => void;
  matchWindow?: {
    window_start: string;
    window_end: string;
    is_active: boolean;
    match_count: number;
  } | null;
}

export function FunctionExecutionStatus({
  loading,
  onRefreshAll,
  matchWindow
}: FunctionExecutionStatusProps) {
  console.log('Rendering FunctionExecutionStatus, matchWindow:', matchWindow);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshAll}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
        
        {matchWindow?.is_active && (
          <Alert variant="default" className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Match window active: {matchWindow.match_count} active matches
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}