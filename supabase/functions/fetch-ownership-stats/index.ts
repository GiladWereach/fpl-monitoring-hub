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

    // Log URI format (without credentials)
    const sanitizedUri = mongoUri.replace(
      /(mongodb\+srv:\/\/)([^:]+):([^@]+)@/,
      '$1[username]:[password]@'
    );
    console.log('Attempting connection with URI format:', sanitizedUri);

    const client = new MongoClient();
    
    try {
      console.log('Initializing connection...');
      await client.connect(mongoUri);
      console.log('Connected to MongoDB successfully');

      const db = client.database('fpl_data');
      console.log('Selected database:', db.name);
      
      const collection = db.collection('ownership_stats');
      console.log('Accessing collection:', collection.name);

      console.log('Executing find query...');
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
      
      // Detailed error logging for authentication issues
      if (dbError.message?.includes('bad auth')) {
        console.error('Authentication failed. Common causes:');
        console.error('1. Incorrect username or password');
        console.error('2. IP not whitelisted in MongoDB Atlas');
        console.error('3. Database user doesn\'t have correct permissions');
      }

      // Log the specific error code and name if available
      if (dbError.code) {
        console.error('Error code:', dbError.code);
        console.error('Error codeName:', dbError.codeName);
      }

      // Always ensure connection is closed on error
      try {
        await client.close();
        console.log('MongoDB connection closed after error');
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError);
      }

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