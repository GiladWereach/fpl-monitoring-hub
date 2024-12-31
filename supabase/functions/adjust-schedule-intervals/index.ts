import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting schedule interval adjustment...')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get match-dependent schedules (both from enum and json config)
    const { data: schedules, error: schedulesError } = await supabaseClient
      .from('schedules')
      .select('*')
      .eq('enabled', true)
      .or(`schedule_type.eq.match_dependent,and(schedule_type.eq.time_based,time_config->type.eq.match_dependent)`)

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError)
      throw schedulesError
    }

    console.log(`Found ${schedules?.length || 0} match-dependent schedules`)

    // Get current match window status
    const { data: matchWindow, error: matchWindowError } = await supabaseClient
      .rpc('get_current_match_window')
      .single()

    if (matchWindowError) {
      console.error('Error getting match window:', matchWindowError)
      throw matchWindowError
    }

    console.log('Current match window:', matchWindow)

    const updates = []
    for (const schedule of (schedules || [])) {
      const timeConfig = schedule.time_config || {}
      const intervalMinutes = matchWindow?.is_active
        ? timeConfig.matchDayIntervalMinutes || 2  // Default to 2 minutes during matches
        : timeConfig.nonMatchIntervalMinutes || 30 // Default to 30 minutes otherwise

      const nextExecution = new Date(Date.now() + intervalMinutes * 60 * 1000)

      console.log(`Adjusting schedule ${schedule.function_name} to ${intervalMinutes} minute interval`)
      
      updates.push(
        supabaseClient
          .from('schedules')
          .update({ 
            next_execution_at: nextExecution.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', schedule.id)
      )

      // Log the adjustment for monitoring
      updates.push(
        supabaseClient
          .from('api_health_metrics')
          .insert({
            endpoint: `schedule_adjustment_${schedule.function_name}`,
            success_count: 1,
            error_count: 0,
            avg_response_time: 0,
            error_pattern: {
              match_window: matchWindow?.is_active ? 'active' : 'inactive',
              interval: intervalMinutes
            }
          })
      )
    }

    // Execute all updates in parallel
    const results = await Promise.allSettled(updates)
    const errors = results.filter(r => r.status === 'rejected')
    
    if (errors.length > 0) {
      console.error('Some updates failed:', errors)
      throw new Error(`${errors.length} updates failed`)
    }

    console.log('Successfully adjusted all schedule intervals')
    return new Response(
      JSON.stringify({
        success: true,
        schedules_updated: schedules?.length || 0,
        match_window: matchWindow
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error adjusting schedules:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})