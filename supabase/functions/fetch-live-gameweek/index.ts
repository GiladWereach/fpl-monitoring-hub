import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LivePlayerData {
  id: number;
  stats: {
    minutes: number;
    total_points: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    own_goals: number;
    penalties_saved: number;
    penalties_missed: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    bonus: number;
    bps: number;
    influence: string;
    creativity: string;
    threat: string;
    ict_index: string;
    starts: number;
    expected_goals: string;
    expected_assists: string;
    expected_goal_involvements: string;
    expected_goals_conceded: string;
  };
  explain: any[];
  in_dreamteam: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting live gameweek data fetch...')
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find current gameweek
    const { data: currentEvent, error: eventError } = await supabaseClient
      .from('events')
      .select('id')
      .lt('deadline_time', new Date().toISOString())
      .gt('deadline_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('deadline_time', { ascending: false })
      .limit(1)
      .single()

    if (eventError) throw eventError
    if (!currentEvent) throw new Error('No current gameweek found')

    console.log(`Current gameweek: ${currentEvent.id}`)

    // Fetch live data from FPL API
    const response = await fetch(`https://fantasy.premierleague.com/api/event/${currentEvent.id}/live/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://fantasy.premierleague.com/',
        'Origin': 'https://fantasy.premierleague.com'
      }
    })

    if (!response.ok) {
      console.error(`FPL API error: ${response.status}`, await response.text())
      throw new Error(`FPL API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Fetched live data for ${data.elements.length} players`)

    // Process and upsert live data
    for (const element of data.elements) {
      const playerData: LivePlayerData = element
      
      const { error: upsertError } = await supabaseClient
        .from('gameweek_live_performance')
        .upsert({
          event_id: currentEvent.id,
          player_id: playerData.id,
          modified: true,
          in_dreamteam: playerData.in_dreamteam,
          minutes: playerData.stats.minutes,
          total_points: playerData.stats.total_points,
          goals_scored: playerData.stats.goals_scored,
          assists: playerData.stats.assists,
          clean_sheets: playerData.stats.clean_sheets,
          goals_conceded: playerData.stats.goals_conceded,
          own_goals: playerData.stats.own_goals,
          penalties_saved: playerData.stats.penalties_saved,
          penalties_missed: playerData.stats.penalties_missed,
          yellow_cards: playerData.stats.yellow_cards,
          red_cards: playerData.stats.red_cards,
          saves: playerData.stats.saves,
          bonus: playerData.stats.bonus,
          bps: playerData.stats.bps,
          influence: parseFloat(playerData.stats.influence),
          creativity: parseFloat(playerData.stats.creativity),
          threat: parseFloat(playerData.stats.threat),
          ict_index: parseFloat(playerData.stats.ict_index),
          starts: playerData.stats.starts,
          expected_goals: parseFloat(playerData.stats.expected_goals),
          expected_assists: parseFloat(playerData.stats.expected_assists),
          expected_goal_involvements: parseFloat(playerData.stats.expected_goal_involvements),
          expected_goals_conceded: parseFloat(playerData.stats.expected_goals_conceded),
          points_breakdown: playerData.explain,
          last_updated: new Date().toISOString()
        })

      if (upsertError) {
        console.error(`Error upserting player ${playerData.id}:`, upsertError)
        throw upsertError
      }
    }

    console.log('Live gameweek data processed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Live gameweek data updated successfully',
        gameweek: currentEvent.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})