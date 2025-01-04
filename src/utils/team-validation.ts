import { supabase } from '@/integrations/supabase/client';

export interface TeamValidationResult {
  isValid: boolean;
  isReturning: boolean;
  lastGameweek?: number;
  error?: string;
}

export async function validateTeamId(teamId: string): Promise<TeamValidationResult> {
  if (!teamId || isNaN(Number(teamId))) {
    return {
      isValid: false,
      isReturning: false,
      error: "Please enter a valid FPL team ID"
    };
  }

  try {
    console.log('Checking if team exists:', teamId);
    const { data: existingTeam, error: queryError } = await supabase
      .from('fpl_teams')
      .select('*')
      .eq('fpl_team_id', Number(teamId))
      .order('event', { ascending: false })
      .limit(1);

    if (queryError) throw queryError;

    if (existingTeam && existingTeam.length > 0) {
      console.log('Found existing team:', existingTeam[0]);
      return {
        isValid: true,
        isReturning: true,
        lastGameweek: existingTeam[0].event
      };
    }

    return {
      isValid: true,
      isReturning: false
    };

  } catch (error) {
    console.error('Error validating team:', error);
    return {
      isValid: false,
      isReturning: false,
      error: error.message
    };
  }
}