import { serve } from "std/server";
import { MongoClient, ServerApiVersion } from "https://deno.land/x/mongo@v0.31.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting ownership stats fetch...');
    
    // Get MongoDB credentials from environment
    const username = encodeURIComponent(Deno.env.get('MONGODB_USERNAME') || '');
    const password = encodeURIComponent(Deno.env.get('MONGODB_PASSWORD') || '');
    const cluster = Deno.env.get('MONGODB_CLUSTER') || '';
    const dbName = Deno.env.get('MONGODB_DATABASE') || '';

    if (!username || !password || !cluster || !dbName) {
      console.error('Missing MongoDB configuration');
      throw new Error('MongoDB configuration incomplete. Please check all required environment variables.');
    }

    // Construct MongoDB URI with credentials
    const uri = `mongodb+srv://${username}:${password}@${cluster}/?retryWrites=true&w=majority&appName=fplbackend`;
    console.log('Connecting to MongoDB with URI pattern:', uri.replace(password, '***'));

    // Create MongoDB client with recommended options
    const client = new MongoClient();
    
    try {
      console.log('Initializing MongoDB connection...');
      await client.connect({
        db: dbName,
        tls: true,
        servers: [{ 
          host: cluster, 
          port: 27017 
        }],
        credential: {
          username: username,
          password: password,
          mechanism: "SCRAM-SHA-1"
        },
        serverApi: {
          version: "1",
          strict: true,
          deprecationErrors: true,
        }
      });

      console.log('Successfully connected to MongoDB');

      const db = client.database(dbName);
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
        console.error('1. Username and password are correct');
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
        details: error.message || 'Unknown error in ownership stats fetch'
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500
      },
    );
  }
});