import { MongoClient } from "mongodb";
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

  let client: MongoClient | null = null;

  try {
    console.log('Starting ownership stats fetch...');
    
    const mongoUri = Deno.env.get('MONGODB_URI');
    if (!mongoUri) {
      console.error('MONGODB_URI environment variable is not set');
      throw new Error('MONGODB_URI environment variable is not set');
    }
    console.log('MongoDB URI exists:', !!mongoUri);

    // Initialize and connect MongoDB client
    console.log('Initializing MongoDB client...');
    client = new MongoClient();
    
    try {
      await client.connect(mongoUri);
      console.log('Successfully connected to MongoDB');
    } catch (connError) {
      console.error('MongoDB connection error:', connError);
      throw connError;
    }

    const dbName = Deno.env.get('MONGODB_DB_NAME') || 'fpl_data';
    console.log('Using database:', dbName);
    const db = client.database(dbName);
    const collection = db.collection('ownership_stats');

    console.log('Fetching latest ownership stats...');
    const latestData = await collection
      .find({})
      .sort({ event: -1 })
      .limit(1)
      .toArray();

    if (!latestData.length) {
      throw new Error('No ownership data found');
    }

    const event = latestData[0].event;
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