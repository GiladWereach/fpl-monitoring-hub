import { ScrollArea } from "@/components/ui/scroll-area";
import { ScheduleCategory } from "./types/scheduleTypes";
import { functions, getCategoryDescription } from "./utils/functionConfigs";
import { FunctionExecutionStatus } from "./components/FunctionExecutionStatus";
import { CategorySection } from "./components/CategorySection";
import { useSchedules } from "./hooks/useSchedules";
import { useMatchWindow } from "./hooks/useMatchWindow";
import { useFunctionExecution } from "./hooks/useFunctionExecution";

export function EdgeFunctionManager() {
  const { data: schedules, refetch: refetchSchedules } = useSchedules();
  const { data: matchWindow } = useMatchWindow(schedules, refetchSchedules);
  const { loading, handleExecute, refreshAll } = useFunctionExecution(refetchSchedules);

  const categories: ScheduleCategory[] = ['core_data', 'match_dependent', 'system', 'analytics'];

  // Convert Date objects to ISO strings for the matchWindow and ensure boolean type for is_active
  const formattedMatchWindow = matchWindow ? {
    window_start: matchWindow.window_start.toISOString(),
    window_end: matchWindow.window_end.toISOString(),
    is_active: Boolean(matchWindow.is_active),
    match_count: matchWindow.match_count
  } : null;

  return (
    <div className="space-y-6">
      <FunctionExecutionStatus 
        loading={loading} 
        onRefreshAll={refreshAll}
        matchWindow={formattedMatchWindow}
      />

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="min-w-[600px] pr-4 space-y-8">
          {categories.map(category => {
            const categoryFunctions = functions.filter(f => f.scheduleConfig.category === category);
            if (categoryFunctions.length === 0) return null;

            return (
              <CategorySection
                key={category}
                category={category}
                description={getCategoryDescription(category)}
                functions={categoryFunctions}
                loading={Boolean(loading)}
                onExecute={handleExecute}
                schedules={schedules || []}
                matchWindow={formattedMatchWindow}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}