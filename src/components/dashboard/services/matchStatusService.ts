import { supabase } from "@/integrations/supabase/client";

export interface MatchStatus {
  hasActiveMatches: boolean;
  isMatchDay: boolean;
  nextMatchTime?: Date;
}

export async function determineMatchStatus(): Promise<MatchStatus> {
  console.log('Determining match status...');
  
  try {
    // Check for active matches
    const { data: activeMatches, error: activeError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('started', true)
      .eq('finished', false);

    if (activeError) throw activeError;

    // Check for upcoming matches within 2 hours
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

    const { data: upcomingMatches, error: upcomingError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('started', false)
      .lte('kickoff_time', twoHoursFromNow.toISOString());

    if (upcomingError) throw upcomingError;

    const status: MatchStatus = {
      hasActiveMatches: activeMatches && activeMatches.length > 0,
      isMatchDay: (activeMatches && activeMatches.length > 0) || 
                 (upcomingMatches && upcomingMatches.length > 0)
    };

    if (upcomingMatches && upcomingMatches.length > 0) {
      status.nextMatchTime = new Date(upcomingMatches[0].kickoff_time);
    }

    console.log('Match status determined:', status);
    return status;
  } catch (error) {
    console.error('Error determining match status:', error);
    // Return safe defaults if there's an error
    return {
      hasActiveMatches: false,
      isMatchDay: false
    };
  }
}