import { ScrollArea } from "@/components/ui/scroll-area";
import { ScheduleCategory } from "./types/scheduleTypes";
import { functions, getCategoryDescription } from "./utils/functionConfigs";
import { CategorySection } from "./components/CategorySection";
import { useSchedules } from "./hooks/useSchedules";
import { useMatchWindow } from "./hooks/useMatchWindow";
import { useFunctionExecution } from "./hooks/useFunctionExecution";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { LiveStatus } from "./LiveStatus";
import { UTCClock } from "./components/UTCClock";
import { GameweekTransition } from "@/components/gameweek-live/GameweekTransition";

export function EdgeFunctionManager() {
  console.log("Rendering EdgeFunctionManager");
  const { data: schedules, refetch: refetchSchedules } = useSchedules();
  const { data: matchWindow } = useMatchWindow(schedules, refetchSchedules);
  const { loading, handleExecute, refreshAll } = useFunctionExecution(refetchSchedules);

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

  return (
    <div className="space-y-6">
      {/* Gameweek Transition Status */}
      <GameweekTransition />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Game Week Status */}
        <Card className="p-4 bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Match Window Status</span>
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