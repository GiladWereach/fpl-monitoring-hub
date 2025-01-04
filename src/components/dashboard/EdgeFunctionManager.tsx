import { ScrollArea } from "@/components/ui/scroll-area";
import { ScheduleCategory } from "./types/scheduleTypes";
import { functions, getCategoryDescription } from "./utils/functionConfigs";
import { CategorySection } from "./components/CategorySection";
import { useSchedules } from "./hooks/useSchedules";
import { useMatchWindow } from "./hooks/useMatchWindow";
import { useFunctionExecution } from "./hooks/useFunctionExecution";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Timer, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { LiveStatus } from "./LiveStatus";
import { UTCClock } from "./components/UTCClock";
import { GameweekTransition } from "@/components/gameweek-live/GameweekTransition";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function EdgeFunctionManager() {
  console.log("Rendering EdgeFunctionManager");
  const { data: schedules, refetch: refetchSchedules } = useSchedules();
  const { data: matchWindow } = useMatchWindow(schedules, refetchSchedules);
  const { loading, handleExecute, refreshAll } = useFunctionExecution(refetchSchedules);

  const { data: currentEvent } = useQuery({
    queryKey: ['current-event'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_current', true)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const categories: ScheduleCategory[] = ['core_data', 'match_dependent', 'system', 'analytics'];

  // Sort schedules by priority (higher priority first)
  const sortedSchedules = schedules?.sort((a, b) => (b.priority || 0) - (a.priority || 0)) || [];

  // Ensure dates are properly handled for the match window
  const formattedMatchWindow = matchWindow ? {
    window_start: new Date(matchWindow.window_start).toISOString(),
    window_end: new Date(matchWindow.window_end).toISOString(),
    is_active: Boolean(matchWindow.is_active),
    match_count: matchWindow.match_count
  } : null;

  const getIntervalStatus = () => {
    if (!formattedMatchWindow) return "30 minutes (default)";
    if (formattedMatchWindow.is_active) return "2 minutes (match active)";
    return "30 minutes (no active matches)";
  };

  const getNextTransitionTime = () => {
    if (!currentEvent?.deadline_time) return null;
    const deadline = new Date(currentEvent.deadline_time);
    const now = new Date();
    
    // If within 15 minutes before deadline
    if (now < deadline && now > new Date(deadline.getTime() - 15 * 60 * 1000)) {
      return "2 minutes at " + format(deadline, "HH:mm");
    }
    
    // If match window is active, show when it ends
    if (formattedMatchWindow?.is_active && formattedMatchWindow.window_end) {
      return "30 minutes at " + format(new Date(formattedMatchWindow.window_end), "HH:mm");
    }
    
    // If we have a next match
    if (matchWindow?.next_kickoff) {
      const nextMatch = new Date(matchWindow.next_kickoff);
      const transitionTime = new Date(nextMatch.getTime() - 15 * 60 * 1000);
      if (now < transitionTime) {
        return "2 minutes at " + format(transitionTime, "HH:mm");
      }
    }
    
    return "No upcoming transitions";
  };

  return (
    <div className="space-y-6">
      {/* Gameweek Transition Status */}
      <GameweekTransition />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Game Week Status */}
        <Card className="p-4 bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Match Window</span>
            </div>
            <LiveStatus showLabel showWindow />
          </div>
        </Card>

        {/* Current Interval */}
        <Card className="p-4 bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Current Interval</span>
            </div>
            <Badge variant={formattedMatchWindow?.is_active ? "success" : "secondary"}>
              {getIntervalStatus()}
            </Badge>
          </div>
        </Card>

        {/* Next Transition */}
        <Card className="p-4 bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Next Transition</span>
            </div>
            <Badge variant="outline">
              {getNextTransitionTime()}
            </Badge>
          </div>
        </Card>

        {/* UTC Clock */}
        <UTCClock />
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="min-w-[600px] pr-4 space-y-8">
          {categories.map(category => {
            const categoryFunctions = functions
              .filter(f => f.scheduleConfig.category === category)
              .sort((a, b) => (b.priority || 0) - (a.priority || 0));

            if (categoryFunctions.length === 0) return null;

            return (
              <CategorySection
                key={category}
                category={category}
                description={getCategoryDescription(category)}
                functions={categoryFunctions}
                loading={Boolean(loading)}
                onExecute={handleExecute}
                schedules={sortedSchedules}
                matchWindow={formattedMatchWindow}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}