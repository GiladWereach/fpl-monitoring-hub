import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Calendar, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { UTCClock } from "./UTCClock";

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gameweek Status */}
        <Card className="p-4 bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Match Window Status</span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs ${
              matchWindow?.is_active 
                ? 'bg-green-500/20 text-green-500' 
                : 'bg-yellow-500/20 text-yellow-500'
            }`}>
              {matchWindow?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </Card>

        {/* Match Count */}
        <Card className="p-4 bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Active Matches</span>
            </div>
            <span className="text-sm">
              {matchWindow?.match_count || 0} matches
            </span>
          </div>
        </Card>

        {/* UTC Clock */}
        <UTCClock />
      </div>

      <div className="flex items-center justify-between">
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
              2-minute interval active: {format(new Date(matchWindow.window_start), 'HH:mm')} - {format(new Date(matchWindow.window_end), 'HH:mm')} UTC
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}