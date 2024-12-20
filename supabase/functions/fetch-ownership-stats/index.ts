import { serve } from "std/server";
import { MongoClient } from "https://deno.land/x/mongo@v0.31.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting ownership stats fetch...');
    
    const mongoUri = Deno.env.get('MONGODB_URI');
    if (!mongoUri) {
      console.error('MONGODB_URI environment variable is not set');
      throw new Error('MongoDB URI not configured');
    }

    // Validate MongoDB URI format
    const uriPattern = /^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/;
    if (!uriPattern.test(mongoUri)) {
      console.error('Invalid MongoDB URI format');
      throw new Error('Invalid MongoDB URI format. Expected: mongodb+srv://username:password@cluster/database');
    }

    // Log sanitized URI for debugging
    const sanitizedUri = mongoUri.replace(
      /(mongodb\+srv:\/\/)([^:]+):([^@]+)@/,
      '$1[username]:[password]@'
    );
    console.log('Attempting connection with URI:', sanitizedUri);

    const client = new MongoClient();
    
    try {
      console.log('Initializing MongoDB connection...');
      await client.connect(mongoUri);
      console.log('Successfully connected to MongoDB');

      const db = client.database('fpl_data');
      console.log('Accessing database:', db.name);
      
      const collection = db.collection('ownership_stats');
      console.log('Accessing collection:', collection.name);

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
      
      if (dbError.message?.includes('bad auth')) {
        console.error('Authentication failed. Please verify:');
        console.error('1. Username and password are correct and URL-encoded');
        console.error('2. Database user exists and has correct permissions');
        console.error('3. IP address is whitelisted in MongoDB Atlas');
        console.error('4. Database and collection names are correct');
      }

      if (dbError.code) {
        console.error('Error code:', dbError.code);
        console.error('Error codeName:', dbError.codeName);
      }

      try {
        await client.close();
        console.log('MongoDB connection closed after error');
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError);
      }

      throw new Error(`MongoDB Connection Error: ${dbError.message}`);
    }

  } catch (error) {
    console.error('Function error:', error);
    
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
  }
});