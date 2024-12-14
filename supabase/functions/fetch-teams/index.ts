import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting teams data fetch...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/')
    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Teams data fetched successfully')

    const mappedTeams = data.teams.map(team => ({
      id: team.id,
      code: team.code,
      name: team.name,
      short_name: team.short_name,
      strength: team.strength,
      strength_overall_home: team.strength_overall_home,
      strength_overall_away: team.strength_overall_away,
      strength_attack_home: team.strength_attack_home,
      strength_attack_away: team.strength_attack_away,
      strength_defence_home: team.strength_defence_home,
      strength_defence_away: team.strength_defence_away,
      points: team.points,
      position: team.position,
      played: team.played,
      form: team.form,
      win: team.win,
      loss: team.loss,
      draw: team.draw,
      pulse_id: team.pulse_id,
      team_division: team.team_division,
      last_updated: new Date().toISOString()
    }))

    const { error: teamsError } = await supabaseClient
      .from('teams')
      .upsert(mappedTeams)

    if (teamsError) throw teamsError

    console.log('Teams data processed successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Teams data ingestion completed successfully' }),
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