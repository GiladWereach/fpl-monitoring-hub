import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from '@supabase/supabase-js';
import { TeamResponse } from './types';
import { storeTeamData } from './database';
import { calculateFormation, getFormationPositions } from './utils';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { teamId } = await req.json();
    console.log(`Fetching data for team ID: ${teamId}`);

    // Get current gameweek
    const bootstrapResponse = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
    if (!bootstrapResponse.ok) {
      throw new Error(`Bootstrap API failed with status ${bootstrapResponse.status}`);
    }

    const bootstrapData = await bootstrapResponse.json();
    const currentEvent = bootstrapData.events.find((e: any) => e.is_current)?.id;
    
    if (!currentEvent) {
      throw new Error('Could not determine current gameweek');
    }

    // Fetch team data from FPL API
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

    const teamData = await teamResponse.json();
    const formation = calculateFormation(teamData.picks);

    // Store data in Supabase
    await storeTeamData(
      teamId,
      currentEvent,
      teamData.picks,
      teamData.entry_history,
      formation
    );

    // Return formatted response
    const response: TeamResponse = {
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
        formation: {
          formation,
          positions: getFormationPositions(formation)
        }
      }
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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