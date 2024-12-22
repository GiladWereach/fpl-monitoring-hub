import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Schedule, ProcessedSchedule } from './types.ts';
import { processSchedule } from './schedule-processor.ts';

export const processSchedules = async (supabaseClient: ReturnType<typeof createClient>) => {
  console.log('Starting schedule processing...');
  
  try {
    const { data: activeSchedules, error: schedulesError } = await supabaseClient
      .from('function_schedules')
      .select(`
        *,
        schedule_groups (
          name,
          description
        )
      `)
      .eq('status', 'active')
      .or('next_execution_at.is.null,next_execution_at.lte.now()');

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    console.log(`Found ${activeSchedules?.length || 0} active schedules to process`);
    const processedSchedules: ProcessedSchedule[] = [];

    for (const schedule of (activeSchedules || [])) {
      try {
        const result = await processSchedule(supabaseClient, schedule);
        processedSchedules.push(result);
      } catch (error) {
        console.error(`Failed to process schedule ${schedule.id}:`, error);
      }
    }

    return processedSchedules;
  } catch (error) {
    console.error('Fatal error in processSchedules:', error);
    throw error;
  }
};