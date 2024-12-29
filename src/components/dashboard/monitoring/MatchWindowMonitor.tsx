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

export function MatchWindowMonitor() {
  console.log('Rendering MatchWindowMonitor');

  const { data: windowState, isLoading } = useQuery({
    queryKey: ['match-window-state'],
    queryFn: async () => {
      console.log('Fetching match window state');
      const { data: window, error } = await supabase.rpc('get_current_match_window');
      
      if (error) throw error;
      
      const state: MatchWindowState = window || {
        window_start: '',
        window_end: '',
        is_active: false,
        match_count: 0,
        next_kickoff: null
      };
      
      return {
        isActive: state.is_active,
        matchCount: state.match_count,
        windowStart: state.window_start ? new Date(state.window_start) : null,
        windowEnd: state.window_end ? new Date(state.window_end) : null,
        nextKickoff: state.next_kickoff ? new Date(state.next_kickoff) : null
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