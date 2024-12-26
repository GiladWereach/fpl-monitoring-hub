import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MatchStatus {
  hasActiveMatches: boolean;
  matchDayWindow: {
    start: Date | null;
    end: Date | null;
  };
  isMatchDay: boolean;
  hasPostponedMatches: boolean;
  nextScheduledMatch: Date | null;
  recoveryStatus?: {
    hasRecoveringMatches: boolean;
    nextRecoveryWindow?: Date;
  };
}

export async function detectMatchWindow({ timezone = 'UTC' }: { timezone?: string } = {}): Promise<MatchStatus> {
  console.log('Detecting match window...');
  
  try {
    // Check for active matches
    const { data: activeMatches, error: activeError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('started', true)
      .eq('finished', false);

    if (activeError) {
      console.error('Error fetching active matches:', activeError);
      throw activeError;
    }

    // Check for postponed matches that are rescheduled
    const { data: recoveringMatches, error: recoveryError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('postponed', true)
      .not('original_kickoff_time', 'is', null)
      .order('kickoff_time', { ascending: true });

    if (recoveryError) {
      console.error('Error fetching recovering matches:', recoveryError);
      throw recoveryError;
    }

    const now = new Date();
    const hasRecoveringMatches = recoveringMatches && recoveringMatches.length > 0;
    const nextRecoveryWindow = hasRecoveringMatches ? new Date(recoveringMatches[0].kickoff_time) : undefined;

    if (activeMatches && activeMatches.length > 0) {
      console.log(`Found ${activeMatches.length} active matches`);
      const firstMatch = new Date(activeMatches[0].kickoff_time);
      const lastMatch = new Date(activeMatches[activeMatches.length - 1].kickoff_time);
      const windowEnd = new Date(lastMatch);
      windowEnd.setHours(windowEnd.getHours() + 2.5); // 2.5 hours after last kickoff

      return {
        hasActiveMatches: true,
        matchDayWindow: {
          start: firstMatch,
          end: windowEnd
        },
        isMatchDay: true,
        hasPostponedMatches: hasRecoveringMatches,
        nextScheduledMatch: null,
        recoveryStatus: {
          hasRecoveringMatches,
          nextRecoveryWindow
        }
      };
    }

    // Check for upcoming matches
    const { data: upcomingMatches, error: upcomingError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('started', false)
      .gt('kickoff_time', now.toISOString())
      .order('kickoff_time', { ascending: true })
      .limit(1);

    if (upcomingError) {
      console.error('Error fetching upcoming matches:', upcomingError);
      throw upcomingError;
    }

    return {
      hasActiveMatches: false,
      matchDayWindow: {
        start: null,
        end: null
      },
      isMatchDay: false,
      hasPostponedMatches: hasRecoveringMatches,
      nextScheduledMatch: upcomingMatches?.[0]?.kickoff_time ? new Date(upcomingMatches[0].kickoff_time) : null,
      recoveryStatus: {
        hasRecoveringMatches,
        nextRecoveryWindow
      }
    };
  } catch (error) {
    console.error('Error in detectMatchWindow:', error);
    toast({
      title: "Error Detecting Match Window",
      description: "Failed to check match status. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
}