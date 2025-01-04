import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface TeamResponse {
  success: boolean;
  data?: {
    team_info: TeamInfo;
    picks: PlayerSelection[];
    stats: MatchdayStats;
    formation: FormationData;
  };
  error?: string;
  code?: number;
  details?: string;
}

interface TeamInfo {
  fpl_team_id: number;
  event: number;
  last_updated: string;
}

interface PlayerSelection {
  element_id: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

interface MatchdayStats {
  points: number;
  total_points: number;
  current_rank: number;
  overall_rank: number;
  team_value: number;
  bank: number;
}

interface FormationData {
  formation: string;
  positions: {
    defenders: number[];
    midfielders: number[];
    forwards: number[];
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { teamId } = await req.json();
    console.log(`Fetching data for team ID: ${teamId}`);

    // Get current gameweek
    try {
      const bootstrapResponse = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
      if (!bootstrapResponse.ok) {
        throw new Error(`Bootstrap API failed with status ${bootstrapResponse.status}`);
      }

      const bootstrapText = await bootstrapResponse.text();
      let bootstrapData;
      try {
        bootstrapData = JSON.parse(bootstrapText);
      } catch (e) {
        console.error('Failed to parse bootstrap data:', bootstrapText);
        throw new Error('Invalid JSON response from bootstrap API');
      }

      const currentEvent = bootstrapData.events.find((e: any) => e.is_current)?.id;
      if (!currentEvent) {
        throw new Error('Could not determine current gameweek');
      }

      // Initialize Supabase client
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // First, check if we already have team selection data for this gameweek
      console.log(`Checking existing team selection for teamId: ${teamId}, event: ${currentEvent}`);
      const { data: existingSelection, error: selectionCheckError } = await supabaseClient
        .from('team_selections')
        .select('*')
        .eq('fpl_team_id', teamId)
        .eq('event', currentEvent)
        .maybeSingle();

      if (selectionCheckError) {
        console.error('Error checking existing team selection:', selectionCheckError);
        throw selectionCheckError;
      }

      let teamData;
      if (!existingSelection) {
        // If no existing selection, fetch from FPL API
        console.log('No existing selection found, fetching from FPL API');
        const teamResponse = await fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/event/${currentEvent}/picks/`);
        
        if (!teamResponse.ok) {
          if (teamResponse.status === 404) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Team not found',
                code: 404
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            );
          }
          throw new Error(`Failed to fetch team data: ${teamResponse.statusText}`);
        }

        const teamResponseText = await teamResponse.text();
        try {
          teamData = JSON.parse(teamResponseText);
        } catch (e) {
          console.error('Failed to parse team data:', teamResponseText);
          throw new Error('Invalid JSON response from team API');
        }

        console.log('Successfully fetched team data from FPL API');
      } else {
        console.log('Found existing team selection, using stored data');
        teamData = {
          picks: existingSelection.picks,
          entry_history: {
            event: currentEvent,
            points: existingSelection.points,
            total_points: existingSelection.total_points,
            rank: existingSelection.current_rank,
            overall_rank: existingSelection.overall_rank,
            value: existingSelection.team_value,
            bank: existingSelection.bank
          }
        };
      }

      // Store team data
      const { error: insertError } = await supabaseClient
        .from('fpl_teams')
        .upsert({
          fpl_team_id: teamId,
          event: currentEvent,
          last_fetch: new Date().toISOString(),
        }, {
          onConflict: 'fpl_team_id,event'
        });

      if (insertError) {
        console.error('Error storing team data:', insertError);
        throw insertError;
      }

      // Calculate formation
      const formation = calculateFormation(teamData.picks);

      // Store or update team selection
      const { error: selectionError } = await supabaseClient
        .from('team_selections')
        .upsert({
          fpl_team_id: teamId,
          event: currentEvent,
          formation: formation.formation,
          captain_id: teamData.picks.find((p: any) => p.is_captain).element,
          vice_captain_id: teamData.picks.find((p: any) => p.is_vice_captain).element,
          picks: teamData.picks,
          auto_subs: teamData.automatic_subs || []
        }, {
          onConflict: 'fpl_team_id,event'
        });

      if (selectionError) {
        console.error('Error storing selection data:', selectionError);
        throw selectionError;
      }

      // Store or update team performance
      const { error: performanceError } = await supabaseClient
        .from('team_performances')
        .upsert({
          fpl_team_id: teamId,
          event: currentEvent,
          points: teamData.entry_history.points,
          total_points: teamData.entry_history.total_points,
          current_rank: teamData.entry_history.rank,
          overall_rank: teamData.entry_history.overall_rank,
          team_value: teamData.entry_history.value,
          bank: teamData.entry_history.bank
        }, {
          onConflict: 'fpl_team_id,event'
        });

      if (performanceError) {
        console.error('Error storing performance data:', performanceError);
        throw performanceError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            team_info: {
              fpl_team_id: teamId,
              event: currentEvent,
              last_updated: new Date().toISOString()
            },
            picks: teamData.picks,
            stats: {
              points: teamData.entry_history.points,
              total_points: teamData.entry_history.total_points,
              current_rank: teamData.entry_history.rank,
              overall_rank: teamData.entry_history.overall_rank,
              team_value: teamData.entry_history.value,
              bank: teamData.entry_history.bank
            },
            formation
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Error in bootstrap API:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        code: 500,
        details: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function calculateFormation(picks: any[]): FormationData {
  const starters = picks.filter(p => p.position <= 11);
  const defenders = starters.filter(p => p.element_type === 2).length;
  const midfielders = starters.filter(p => p.element_type === 3).length;
  const forwards = starters.filter(p => p.element_type === 4).length;

  return {
    formation: `${defenders}-${midfielders}-${forwards}`,
    positions: {
      defenders: starters.filter(p => p.element_type === 2).map(p => p.element),
      midfielders: starters.filter(p => p.element_type === 3).map(p => p.element),
      forwards: starters.filter(p => p.element_type === 4).map(p => p.element)
    }
  };
}