import { serve } from "std/server";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting ownership stats fetch...');
    
    // Temporary mock data
    const mockData = [{
      event: 1,
      ownership_data: [
        { player_id: 1, player_name: "Player 1", ownership_percentage: 45.5 },
        { player_id: 2, player_name: "Player 2", ownership_percentage: 32.1 }
      ]
    }];

    console.log('Successfully fetched mock data');
    
    return new Response(
      JSON.stringify(mockData),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in fetch-ownership-stats:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch ownership stats',
        details: error.message || 'Unknown error in ownership stats fetch'
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500,
      },
    );
  }
});