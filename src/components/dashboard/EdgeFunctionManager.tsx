import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScheduleCategory } from "./types/scheduleTypes";
import { functions, getCategoryDescription } from "./utils/functionConfigs";
import { executeFetchFunction } from "./utils/functionExecutor";
import { toast } from "@/hooks/use-toast";
import { FunctionExecutionStatus } from "./components/FunctionExecutionStatus";
import { CategorySection } from "./components/CategorySection";
import { detectMatchWindow } from "@/services/matchWindowService";
import { isTimeConfig } from "./types/scheduling";

interface TimeConfigBase {
  type: 'match_dependent' | 'daily' | 'fixed';
  matchDayIntervalMinutes?: number;
  nonMatchIntervalMinutes?: number;
}

interface Schedule {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based';
  time_config?: TimeConfig;
  enabled: boolean;
}

export function EdgeFunctionManager() {
  const [loading, setLoading] = useState<string | null>(null);

  const { data: schedules, refetch: refetchSchedules } = useQuery({
    queryKey: ['function-schedules'],
    queryFn: async () => {
      console.log('Fetching function schedules');
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          schedule_execution_logs (
            id,
            status,
            started_at,
            completed_at,
            error_details,
            execution_duration_ms
          )
        `)
        .order('function_name');
      
      if (error) {
        console.error('Error fetching schedules:', error);
        throw error;
      }
      
      console.log('Fetched schedules:', data);
      return data;
    },
    refetchInterval: 10000
  });

  const { data: matchWindow } = useQuery({
    queryKey: ['match-window'],
    queryFn: async () => {
      console.log('Detecting match window...');
      try {
        const window = await detectMatchWindow();
        console.log('Match window detected:', window);
        
        if (window && schedules) {
          console.log('Adjusting schedules based on match window:', window);
          const matchDependentSchedules = schedules.filter(s => 
            s.schedule_type === 'time_based' && 
            isTimeConfig(s.time_config) &&
            s.time_config.type === 'match_dependent'
          );

          for (const schedule of matchDependentSchedules) {
            if (!isTimeConfig(schedule.time_config)) continue;

            const intervalMinutes = window.is_active ? 
              schedule.time_config.matchDayIntervalMinutes : 
              schedule.time_config.nonMatchIntervalMinutes;

            if (intervalMinutes) {
              console.log(`Adjusting schedule ${schedule.function_name} to ${intervalMinutes} minute interval`);
              
              try {
                const nextExecution = new Date(Date.now() + intervalMinutes * 60 * 1000);
                await supabase
                  .from('schedules')
                  .update({ 
                    next_execution_at: nextExecution.toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', schedule.id);

                await supabase
                  .from('api_health_metrics')
                  .insert({
                    endpoint: `schedule_adjustment_${schedule.function_name}`,
                    success_count: 1,
                    error_count: 0,
                    avg_response_time: 0,
                    error_pattern: {
                      match_window: window.is_active ? 'active' : 'inactive',
                      interval: intervalMinutes
                    }
                  });
              } catch (error) {
                console.error(`Error adjusting schedule ${schedule.function_name}:`, error);
                await supabase
                  .from('api_health_metrics')
                  .insert({
                    endpoint: `schedule_adjustment_${schedule.function_name}`,
                    success_count: 0,
                    error_count: 1,
                    avg_response_time: 0,
                    error_pattern: {
                      error: error.message,
                      match_window: window.is_active ? 'active' : 'inactive'
                    }
                  });
              }
            }
          }
        }
        
        return window;
      } catch (error) {
        console.error('Error in match window detection:', error);
        toast({
          title: "Match Window Detection Error",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    refetchInterval: 60000
  });

  const handleExecute = async (functionName: string) => {
    setLoading(functionName);
    const executionStartTime = Date.now();
    try {
      console.log(`Executing function: ${functionName}`);
      await executeFetchFunction(functionName);
      const duration = Date.now() - executionStartTime;
      console.log(`Successfully executed ${functionName} in ${duration}ms`);
      
      toast({
        title: "Function Executed",
        description: `Successfully executed ${functionName} in ${duration}ms`,
      });
      
      await refetchSchedules();
    } catch (error) {
      console.error(`Error executing function ${functionName}:`, error);
      toast({
        title: "Execution Error",
        description: `Failed to execute ${functionName}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const refreshAll = async () => {
    setLoading("all");
    const executionStartTime = Date.now();
    let successCount = 0;
    let failureCount = 0;

    for (const func of functions) {
      try {
        console.log(`Refreshing function: ${func.function}`);
        await executeFetchFunction(func.function);
        successCount++;
      } catch (error) {
        console.error(`Error in refresh all for ${func.function}:`, error);
        failureCount++;
      }
    }

    const duration = Date.now() - executionStartTime;
    
    toast({
      title: "Refresh Complete",
      description: `Completed in ${duration}ms. Success: ${successCount}, Failed: ${failureCount}`,
      variant: failureCount > 0 ? "destructive" : "default",
    });
    
    setLoading(null);
    refetchSchedules();
  };

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
