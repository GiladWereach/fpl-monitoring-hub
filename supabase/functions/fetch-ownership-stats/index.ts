import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { MongoClient } from 'https://deno.land/x/mongo@v0.31.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let client: MongoClient | null = null;

  try {
    const mongoUri = Deno.env.get('MONGODB_URI');
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log('Attempting to connect to MongoDB...');
    client = new MongoClient();
    await client.connect(mongoUri);
    
    const dbName = Deno.env.get('MONGODB_DB_NAME') || 'fpl_data';
    const db = client.database(dbName);
    const collection = db.collection('ownership_stats');

    console.log('Fetching latest ownership stats...');
    const latestData = await collection
      .find({})
      .sort({ event: -1 })
      .limit(1)
      .toArray();

    const event = latestData[0]?.event;
    console.log('Latest event found:', event);

    const ownershipData = await collection
      .find({ event })
      .toArray();

    console.log('Successfully fetched ownership data');
    return new Response(
      JSON.stringify(ownershipData),
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
        details: error.message
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500,
      },
    );
  } finally {
    // Always close the connection
    if (client) {
      try {
        await client.close();
        console.log('MongoDB connection closed');
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError);
      }
    }
  }
});