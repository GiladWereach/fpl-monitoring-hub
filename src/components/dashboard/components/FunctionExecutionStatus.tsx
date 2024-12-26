import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, Clock } from "lucide-react";
import { MatchWindow } from "@/services/matchWindowService";
import { format } from "date-fns";

interface FunctionExecutionStatusProps {
  loading: string | null;
  onRefreshAll: () => void;
  matchWindow?: MatchWindow;
}

export function FunctionExecutionStatus({ 
  loading, 
  onRefreshAll,
  matchWindow 
}: FunctionExecutionStatusProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshAll}
          disabled={loading !== null}
        >
          {loading === "all" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh All
            </>
          )}
        </Button>

        {matchWindow && (
          <Alert variant="default">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {matchWindow.type === 'live' && (
                <>Active matches until {format(matchWindow.end, 'HH:mm')}</>
              )}
              {matchWindow.type === 'pre' && matchWindow.nextKickoff && (
                <>Next match at {format(matchWindow.nextKickoff, 'HH:mm')}</>
              )}
              {matchWindow.type === 'idle' && (
                <>No active matches</>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}