import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { MongoClient } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize MongoDB client
    const client = new MongoClient();
    
    // Connect using the MONGODB_URI secret
    await client.connect(Deno.env.get('MONGODB_URI') || '');
    console.log('Connected to MongoDB');

    const db = client.database(Deno.env.get('MONGODB_DB_NAME') || 'fpl_data');
    const collection = db.collection('ownership_stats');

    // Get the latest ownership stats
    const latestStats = await collection
      .find({})
      .sort({ event: -1 })
      .limit(1)
      .toArray();

    await client.close();

    return new Response(
      JSON.stringify({ data: latestStats }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});