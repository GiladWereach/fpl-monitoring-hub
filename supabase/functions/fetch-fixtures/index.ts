import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchWithRetry } from './api-client.ts';
import { upsertFixtures } from './database.ts';
import { logDebug, logError, logInfo } from './logging.ts';
import { validateFixturesData } from './validation.ts';
import { transformFixture, validateTransformedData } from './transformer.ts';
import { FPLFixture, TransformedFixture } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const functionName = 'fetch-fixtures';
  const startTime = Date.now();
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    logInfo(functionName, 'Starting fixtures data fetch...');
    
    // Fetch data with retry logic
    const response = await fetchWithRetry('https://fantasy.premierleague.com/api/fixtures/');
    
    let rawFixtures: FPLFixture[];
    try {
      const text = await response.text();
      logDebug(functionName, `Raw response length: ${text.length}`);
      
      if (!text) {
        throw new Error('Empty response from FPL API');
      }
      
      rawFixtures = JSON.parse(text);
      
      // Validate response structure
      const validationResult = validateFixturesData(rawFixtures);
      if (!validationResult.isValid) {
        throw new Error(`Invalid fixtures data: ${validationResult.errors.join(', ')}`);
      }
    } catch (error) {
      logError(functionName, 'Failed to parse fixtures JSON:', error);
      throw new Error(`Failed to parse fixtures data: ${error.message}`);
    }
    
    logInfo(functionName, `Fetched ${rawFixtures.length} fixtures successfully`);

    // Transform fixtures
    const transformedFixtures: TransformedFixture[] = [];
    for (const fixture of rawFixtures) {
      try {
        const transformed = transformFixture(fixture);
        if (!validateTransformedData(transformed)) {
          throw new Error(`Transformed fixture ${fixture.id} failed validation`);
        }
        transformedFixtures.push(transformed);
      } catch (error) {
        logError(functionName, `Error transforming fixture ${fixture.id}:`, error);
        // Continue with other fixtures
        continue;
      }
    }

    logInfo(functionName, `Successfully transformed ${transformedFixtures.length} fixtures`);

    // Upsert fixtures with validation
    await upsertFixtures(supabaseClient, transformedFixtures);

    const executionTime = Date.now() - startTime;
    logInfo(functionName, `Fixtures data processed successfully in ${executionTime}ms`);

    // Log metrics
    await supabaseClient
      .from('api_health_metrics')
      .insert({
        endpoint: functionName,
        success_count: 1,
        error_count: 0,
        avg_response_time: executionTime,
        last_success_time: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully processed ${transformedFixtures.length} fixtures`,
        executionTime,
        data: transformedFixtures
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logError(functionName, 'Error:', error);
    
    // Log error metrics
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseClient
      .from('api_health_metrics')
      .insert({
        endpoint: functionName,
        success_count: 0,
        error_count: 1,
        avg_response_time: executionTime,
        last_error_time: new Date().toISOString(),
        error_pattern: { error: error.message }
      });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        executionTime 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});