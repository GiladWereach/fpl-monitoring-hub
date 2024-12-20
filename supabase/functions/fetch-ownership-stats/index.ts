import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";
import { MongoClient } from "mongodb";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

async function getMongoClient(): Promise<MongoClient> {
  try {
    const username = Deno.env.get('MONGODB_USERNAME');
    const password = Deno.env.get('MONGODB_PASSWORD');
    
    if (!username || !password) {
      throw new Error('MongoDB credentials not configured');
    }

    const uri = `mongodb+srv://${username}:${password}@fplbackend.jeuit.mongodb.net/?retryWrites=true&w=majority&appName=fplbackend`;
    
    const client = new MongoClient();
    await client.connect(uri);
    
    // Test connection with ping
    const db = client.database('admin');
    await db.command({ ping: 1 });
    console.log("Successfully connected to MongoDB");

    return client;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let mongoClient: MongoClient | null = null;
  
  try {
    console.log('Initializing Supabase client...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the current event
    console.log('Fetching current event...');
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('is_current', true)
      .single();

    if (eventError) {
      throw new Error(`Failed to fetch current event: ${eventError.message}`);
    }

    if (!eventData) {
      throw new Error('No current event found');
    }

    const currentEvent = eventData.id;

    // MongoDB Connection
    console.log('Connecting to MongoDB...');
    mongoClient = await getMongoClient();
    console.log('Successfully connected to MongoDB');

    const database = Deno.env.get("MONGODB_DATABASE");
    if (!database) {
      throw new Error('MONGODB_DATABASE environment variable is not set');
    }

    const db = mongoClient.database(database);
    const collection = db.collection("ownership_data");

    // Fetch ownership data for current gameweek
    console.log(`Fetching ownership data for gameweek ${currentEvent}...`);
    const ownershipData = await collection
      .find({ gameweek: currentEvent })
      .toArray();

    if (!ownershipData.length) {
      console.log('No ownership data found for current gameweek');
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            event: currentEvent,
            ownership_data: []
          }
        }),
        { headers: corsHeaders }
      );
    }

    // Get player details from Supabase
    console.log('Enriching data with player details...');
    const playerIds = [...new Set(ownershipData.map(record => record.player_id))];
    
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, web_name, teams (short_name)')
      .in('id', playerIds);

    if (playersError) {
      throw new Error(`Failed to fetch player details: ${playersError.message}`);
    }

    // Map player details to ownership data
    const enrichedData = ownershipData.map(record => {
      const player = players?.find(p => p.id === record.player_id);
      return {
        player_id: record.player_id,
        player_name: player?.web_name || 'Unknown',
        team_name: player?.teams?.short_name || 'Unknown',
        ownership_percentage: record.ownership_percentage,
        captain_percentage: record.captain_percentage || 0
      };
    });

    console.log('Successfully processed ownership data');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          event: currentEvent,
          ownership_data: enrichedData
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      }
    );

  } catch (error) {
    console.error('Error in fetch-ownership-stats:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch ownership stats',
        details: error.message
      }),
      {
        headers: corsHeaders,
        status: 500
      }
    );
  } finally {
    if (mongoClient) {
      try {
        await mongoClient.close();
        console.log('MongoDB connection closed');
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
      }
    }
  }
});