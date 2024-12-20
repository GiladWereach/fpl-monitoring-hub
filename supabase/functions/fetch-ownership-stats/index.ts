import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { MongoClient, ServerApiVersion } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function connectToMongo(): Promise<MongoClient> {
  try {
    const mongoUri = Deno.env.get('MONGODB_URI');
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log('Attempting to connect to MongoDB...');
    const client = new MongoClient(mongoUri, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    
    // Test the connection
    await client.connect();
    const adminDb = client.database('admin');
    await adminDb.command({ ping: 1 });
    console.log('Successfully connected to MongoDB and verified connection');
    
    return client;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let client: MongoClient | null = null;

  try {
    // Initialize MongoDB client
    client = await connectToMongo();
    console.log('Connected to MongoDB');

    const dbName = Deno.env.get('MONGODB_DB_NAME') || 'fpl_data';
    const db = client.database(dbName);
    const collection = db.collection('ownership_stats');

    // Get the latest ownership stats
    const latestStats = await collection
      .find({})
      .sort({ event: -1 })
      .limit(1)
      .toArray();

    console.log('Successfully fetched ownership stats:', latestStats);

    return new Response(
      JSON.stringify(latestStats),
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