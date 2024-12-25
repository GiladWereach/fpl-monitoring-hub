import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFunctionData(functionName: string, schedule?: any) {
  return useQuery({
    queryKey: ["function-data", functionName],
    queryFn: async () => {
      console.log(`Fetching data for ${functionName}`);
      
      try {
        // Fetch metrics using RPC function
        const { data: metricsData, error: metricsError } = await supabase
          .rpc('get_aggregated_metrics', { hours_lookback: 24 });

        if (metricsError) {
          console.error(`Error fetching metrics for ${functionName}:`, metricsError);
          throw metricsError;
        }

        const metrics = metricsData?.find(m => m.endpoint === functionName);
        console.log(`Metrics data for ${functionName}:`, metrics);

        // Only fetch execution log if we have a valid schedule ID
        let executionLog = null;
        if (schedule?.id) {
          const { data: logData, error: logError } = await supabase
            .from('schedule_execution_logs')
            .select('*')
            .eq('schedule_id', schedule.id)
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (logError && logError.code !== 'PGRST116') {
            console.error(`Error fetching execution log for ${functionName}:`, logError);
            throw logError;
          }
          
          executionLog = logData;
        }

        return {
          metrics,
          schedule,
          lastExecution: executionLog
        };
      } catch (error) {
        console.error(`Error in queryFn for ${functionName}:`, error);
        throw error;
      }
    },
    refetchInterval: 30000,
    staleTime: 25000
  });
}