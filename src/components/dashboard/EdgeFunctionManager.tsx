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

  return (
    <div className="space-y-6">
      <FunctionExecutionStatus 
        loading={loading} 
        onRefreshAll={refreshAll}
        matchWindow={matchWindow}
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
                loading={loading}
                onExecute={handleExecute}
                schedules={schedules || []}
                matchWindow={matchWindow}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}