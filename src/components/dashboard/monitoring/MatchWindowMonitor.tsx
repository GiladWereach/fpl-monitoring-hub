import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { StatusCard } from "../StatusCard";
import { Clock, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface MatchWindowState {
  window_start: string;
  window_end: string;
  is_active: boolean;
  match_count: number;
  next_kickoff: string | null;
}

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
      const { data: window, error } = await supabase.rpc('get_current_match_window');
      
      if (error) throw error;
      
      // Handle the case where no window is returned
      if (!window || !Array.isArray(window) || window.length === 0) {
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
      const currentWindow = window[0] as MatchWindowState;
      
      return {
        isActive: currentWindow.is_active,
        matchCount: currentWindow.match_count,
        windowStart: currentWindow.window_start ? new Date(currentWindow.window_start) : null,
        windowEnd: currentWindow.window_end ? new Date(currentWindow.window_end) : null,
        nextKickoff: currentWindow.next_kickoff ? new Date(currentWindow.next_kickoff) : null
      };
    },
    refetchInterval: 60000
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
    </div>
  );
}