import { serve } from "std/server";
import { MongoClient } from "https://deno.land/x/mongo@v0.31.1/mod.ts";

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
    
    const mongoUri = Deno.env.get('MONGODB_URI');
    if (!mongoUri) {
      console.error('MONGODB_URI environment variable is not set');
      throw new Error('MongoDB URI not configured. Please set the MONGODB_URI secret in Supabase.');
    }

    // Initialize MongoDB client
    const client = new MongoClient();
    console.log('MongoDB client initialized');

    try {
      await client.connect(mongoUri);
      console.log('Connected to MongoDB successfully');

      const db = client.database('fpl_data');
      const collection = db.collection('ownership_stats');

      const ownershipData = await collection
        .find({})
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();

      console.log('Successfully fetched ownership data:', ownershipData.length, 'records');

      await client.close();
      console.log('MongoDB connection closed');

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

    } catch (dbError) {
      console.error('Database operation error:', dbError);
      throw dbError;
    }

  } catch (error) {
    console.error('Function error:', error);
    
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