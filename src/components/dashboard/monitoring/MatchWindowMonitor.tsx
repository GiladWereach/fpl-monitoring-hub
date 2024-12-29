import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { StatusCard } from "../StatusCard";
import { Clock, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { handleMatchWindowFailure } from "./utils/recoveryHandler";
import { trackWindowPerformance, calculateDataFreshness } from "./utils/performanceTracker";
import { getHistoricalAnalytics } from "./utils/windowAnalytics";

interface WindowState {
  isActive: boolean;
  matchCount: number;
  windowStart: Date | null;
  windowEnd: Date | null;
  nextKickoff: Date | null;
}

export function MatchWindowMonitor() {
  console.log('Rendering MatchWindowMonitor');

  const { data: windowState, isLoading } = useQuery({
    queryKey: ['match-window-state'],
    queryFn: async () => {
      console.log('Fetching match window state');
      const startTime = performance.now();
      
      try {
        const { data: window, error } = await supabase.rpc('get_current_match_window');
        
        if (error) throw error;
        
        // Handle the case where no window is returned
        if (!window || !Array.isArray(window) || window.length === 0) {
          console.log('No active match window found');
          const defaultState: WindowState = {
            isActive: false,
            matchCount: 0,
            windowStart: null,
            windowEnd: null,
            nextKickoff: null
          };
          return defaultState;
        }

        // Take the first window from the array
        const currentWindow = window[0];
        
        const state = {
          isActive: currentWindow.is_active,
          matchCount: currentWindow.match_count,
          windowStart: currentWindow.window_start ? new Date(currentWindow.window_start) : null,
          windowEnd: currentWindow.window_end ? new Date(currentWindow.window_end) : null,
          nextKickoff: currentWindow.next_kickoff ? new Date(currentWindow.next_kickoff) : null
        };

        // Track performance metrics
        const responseTime = performance.now() - startTime;
        const dataFreshness = state.windowStart ? calculateDataFreshness(state.windowStart) : 0;
        
        await trackWindowPerformance({
          responseTime,
          dataFreshness,
          errorRate: 0
        });

        console.log('Processed window state:', state);
        return state;
      } catch (error) {
        console.error('Error in match window detection:', error);
        
        // Attempt recovery
        const recovered = await handleMatchWindowFailure(error as Error);
        if (!recovered) {
          throw error;
        }

        // Return default state after recovery attempt
        return {
          isActive: false,
          matchCount: 0,
          windowStart: null,
          windowEnd: null,
          nextKickoff: null
        };
      }
    },
    refetchInterval: 60000
  });

  // Fetch historical analytics
  const { data: analytics } = useQuery({
    queryKey: ['match-window-analytics'],
    queryFn: () => getHistoricalAnalytics(7),
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  if (isLoading) {
    return <Card className="p-4">Loading match window status...</Card>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Match Window Monitor</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          title="Window Status"
          value={windowState?.isActive ? "Active" : "Inactive"}
          status={windowState?.isActive ? "success" : "info"}
          icon={<Activity className="h-4 w-4" />}
          trend={windowState?.matchCount ? {
            value: windowState.matchCount,
            label: "active matches"
          } : undefined}
        />
        
        <StatusCard
          title="Current Window"
          value={windowState?.windowStart ? 
            format(windowState.windowStart, "HH:mm") + " - " + 
            format(windowState.windowEnd!, "HH:mm") : 
            "No active window"}
          status={windowState?.windowStart ? "info" : "warning"}
          icon={<Clock className="h-4 w-4" />}
        />
        
        <StatusCard
          title="Next Kickoff"
          value={windowState?.nextKickoff ? 
            format(windowState.nextKickoff, "HH:mm") :
            "No upcoming matches"}
          status="info"
          icon={windowState?.nextKickoff ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {analytics && (
        <Card className="p-4 mt-4">
          <h3 className="text-md font-semibold mb-3">Historical Analytics (7 Days)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Windows</p>
              <p className="text-2xl font-bold">{analytics.totalWindows}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Duration</p>
              <p className="text-2xl font-bold">{analytics.averageDuration.toFixed(1)}m</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Error Rate</p>
              <p className="text-2xl font-bold">{analytics.errorRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Match Density</p>
              <p className="text-2xl font-bold">{analytics.matchDensity.toFixed(1)}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}