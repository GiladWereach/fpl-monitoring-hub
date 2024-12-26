import { supabase } from "@/integrations/supabase/client";
import { detectMatchWindow } from "./matchWindowService";
import { toast } from "@/hooks/use-toast";

interface ScheduleResolution {
  intervalMinutes: number;
  nextExecutionTime: Date;
  reason: string;
}

export async function resolveSchedule(functionName: string): Promise<ScheduleResolution> {
  console.log(`Resolving schedule for ${functionName}`);
  
  try {
    // Get current schedule configuration
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('function_name', functionName)
      .single();

    if (scheduleError) throw scheduleError;

    if (!schedule) {
      console.error(`No schedule found for ${functionName}`);
      return {
        intervalMinutes: 30,
        nextExecutionTime: new Date(Date.now() + 30 * 60 * 1000),
        reason: 'No schedule configuration found'
      };
    }

    // Detect match window
    const matchWindow = await detectMatchWindow();
    console.log('Match window status:', matchWindow);

    if (!matchWindow) {
      console.log('No match window detected, using default interval');
      return {
        intervalMinutes: 30,
        nextExecutionTime: new Date(Date.now() + 30 * 60 * 1000),
        reason: 'No active match window'
      };
    }

    // Calculate interval based on match window
    let intervalMinutes: number;
    let reason: string;

    if (matchWindow.hasActiveMatches) {
      intervalMinutes = schedule.time_config?.matchDayIntervalMinutes || 2;
      reason = 'Active matches in progress';
      console.log(`Using match day interval: ${intervalMinutes} minutes`);
    } else if (matchWindow.isMatchDay) {
      // Check if we're approaching kickoff (within 30 minutes)
      const nextKickoff = matchWindow.nextMatchTime;
      if (nextKickoff) {
        const timeToKickoff = (new Date(nextKickoff).getTime() - Date.now()) / (1000 * 60);
        if (timeToKickoff <= 30) {
          intervalMinutes = 5; // More frequent updates approaching kickoff
          reason = 'Approaching match kickoff';
          console.log('Approaching kickoff, using 5 minute intervals');
        } else {
          intervalMinutes = schedule.time_config?.nonMatchIntervalMinutes || 30;
          reason = 'Match day but no active matches';
          console.log(`Using non-match interval: ${intervalMinutes} minutes`);
        }
      } else {
        intervalMinutes = schedule.time_config?.nonMatchIntervalMinutes || 30;
        reason = 'Match day but no upcoming matches';
      }
    } else {
      intervalMinutes = schedule.time_config?.nonMatchIntervalMinutes || 30;
      reason = 'Outside match window';
    }

    const nextExecutionTime = new Date(Date.now() + intervalMinutes * 60 * 1000);

    // Update schedule in database
    const { error: updateError } = await supabase
      .from('schedules')
      .update({
        next_execution_at: nextExecutionTime.toISOString(),
        last_execution_at: new Date().toISOString()
      })
      .eq('id', schedule.id);

    if (updateError) {
      console.error('Error updating schedule:', updateError);
      toast({
        title: "Schedule Update Error",
        description: "Failed to update schedule execution time",
        variant: "destructive",
      });
    }

    return {
      intervalMinutes,
      nextExecutionTime,
      reason
    };
  } catch (error) {
    console.error('Error resolving schedule:', error);
    toast({
      title: "Schedule Resolution Error",
      description: "Failed to resolve schedule interval",
      variant: "destructive",
    });
    throw error;
  }
}