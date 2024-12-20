import { serve } from "std/server";
import { MongoClient } from "mongodb";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

async function getMongoClient(): Promise<MongoClient> {
  try {
    const username = Deno.env.get('MONGODB_USERNAME');
    const password = Deno.env.get('MONGODB_PASSWORD');
    const cluster = Deno.env.get('MONGODB_CLUSTER');
    const dbName = Deno.env.get('MONGODB_DATABASE');

    if (!username || !password || !cluster || !dbName) {
      throw new Error('MongoDB configuration incomplete');
    }

    const uri = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${cluster}.jeuit.mongodb.net/${dbName}?authMechanism=SCRAM-SHA-1&ssl=true&retryWrites=true&w=majority`;

    console.log('Attempting MongoDB connection...');
    
    const client = new MongoClient();
    await client.connect(uri, {
      tls: true,
      tlsInsecure: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    
    console.log('MongoDB connection successful!');
    return client;
  } catch (error) {
    console.error('Connection error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function fetchLatestOwnershipStats(db: any) {
  console.log('Fetching latest ownership stats...');
  const collection = db.collection('ownership_stats');
  
  const latestDoc = await collection
    .find()
    .sort({ event: -1 })
    .limit(1)
    .toArray();

  if (!latestDoc.length) {
    throw new Error('No ownership data found');
  }

  const latestEvent = latestDoc[0].event;
  console.log(`Found latest event: ${latestEvent}`);

  const ownershipData = await collection
    .find({ event: latestEvent })
    .toArray();

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch player details from Supabase
  const playerIds = ownershipData.map(stat => stat.player_id);
  const { data: players, error } = await supabase
    .from('players')
    .select('id, web_name, teams (short_name)')
    .in('id', playerIds);

  if (error) {
    console.error('Error fetching player details:', error);
    throw error;
  }

  // Create a map of player details
  const playerMap = new Map(
    players.map(player => [
      player.id,
      { 
        player_name: player.web_name,
        team_name: player.teams?.short_name || 'Unknown'
      }
    ])
  );

  // Combine ownership data with player details
  const enrichedData = ownershipData.map(stat => ({
    ...stat,
    player_name: playerMap.get(stat.player_id)?.player_name || 'Unknown Player',
    team_name: playerMap.get(stat.player_id)?.team_name || 'Unknown Team',
    ownership_percentage: Number(stat.ownership_percentage.toFixed(2)),
    captain_percentage: Number(stat.captain_percentage.toFixed(2))
  }));

  return {
    event: latestEvent,
    ownership_data: enrichedData
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let client: MongoClient | null = null;
  
  try {
    client = await getMongoClient();
    const dbName = Deno.env.get('MONGODB_DATABASE');
    if (!dbName) throw new Error('Database name not configured');
    
    const db = client.database(dbName);
    const data = await fetchLatestOwnershipStats(db);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Function error:', error);
    
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
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
});