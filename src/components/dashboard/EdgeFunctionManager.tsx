import { ScrollArea } from "@/components/ui/scroll-area";
import { ScheduleCategory } from "./types/scheduleTypes";
import { functions, getCategoryDescription } from "./utils/functionConfigs";
import { FunctionExecutionStatus } from "./components/FunctionExecutionStatus";
import { CategorySection } from "./components/CategorySection";
import { useSchedules } from "./hooks/useSchedules";
import { useMatchWindow } from "./hooks/useMatchWindow";
import { useFunctionExecution } from "./hooks/useFunctionExecution";
import { Card } from "@/components/ui/card";

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

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <FunctionExecutionStatus 
          loading={Boolean(loading)} 
          onRefreshAll={refreshAll}
          matchWindow={formattedMatchWindow}
        />
      </Card>

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