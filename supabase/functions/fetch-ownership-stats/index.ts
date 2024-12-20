import { serve } from "std/server";
import { MongoClient } from "mongodb";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

interface OwnershipStat {
  event: number;
  player_id: number;
  ownership_percentage: number;
  captain_percentage: number;
  timestamp: Date;
}

async function getMongoClient(): Promise<MongoClient> {
  const username = Deno.env.get('MONGODB_USERNAME');
  const password = Deno.env.get('MONGODB_PASSWORD');
  const cluster = Deno.env.get('MONGODB_CLUSTER');
  const dbName = Deno.env.get('MONGODB_DATABASE');

  console.log('Initializing MongoDB connection with:', {
    hasUsername: !!username,
    hasPassword: !!password,
    hasCluster: !!cluster,
    hasDbName: !!dbName
  });

  if (!username || !password || !cluster || !dbName) {
    throw new Error('MongoDB configuration incomplete');
  }

  const encodedUsername = encodeURIComponent(username);
  const encodedPassword = encodeURIComponent(password);
  const uri = `mongodb+srv://${encodedUsername}:${encodedPassword}@${cluster}.mongodb.net/${dbName}?retryWrites=true&w=majority`;
  
  const client = new MongoClient();
  await client.connect(uri);
  console.log('MongoDB connection established');
  
  return client;
}

async function fetchLatestOwnershipStats(db: any): Promise<OwnershipStat[]> {
  console.log('Fetching latest ownership stats...');
  
  const collection = db.collection('ownership_stats');
  
  // Get the latest event
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

  // Fetch all ownership data for the latest event
  const ownershipData = await collection
    .find({ event: latestEvent })
    .toArray();

  console.log(`Retrieved ${ownershipData.length} ownership records`);
  return ownershipData;
}

async function testConnection() {
  let client: MongoClient | null = null;
  
  try {
    client = await getMongoClient();
    const dbName = Deno.env.get('MONGODB_DATABASE');
    if (!dbName) throw new Error('Database name not configured');
    
    const db = client.database(dbName);
    const collections = await db.listCollections().toArray();
    
    return {
      success: true,
      connected: true,
      collections: collections.map(c => c.name),
      database: dbName
    };
    
  } catch (error) {
    console.error('Connection test failed:', {
      name: error.name,
      message: error.message,
      cause: error.cause
    });
    
    return {
      success: false,
      error: error.message,
      errorType: error.name,
      connected: false
    };
    
  } finally {
    if (client) {
      await client.close();
      console.log('Test connection closed');
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let client: MongoClient | null = null;
  
  try {
    const url = new URL(req.url);
    
    // Handle test endpoint
    if (url.pathname.endsWith('/test')) {
      const result = await testConnection();
      return new Response(
        JSON.stringify(result),
        { headers: corsHeaders, status: result.success ? 200 : 500 }
      );
    }

    // Main endpoint logic
    client = await getMongoClient();
    const dbName = Deno.env.get('MONGODB_DATABASE');
    if (!dbName) throw new Error('Database name not configured');
    
    const db = client.database(dbName);
    const ownershipData = await fetchLatestOwnershipStats(db);

    return new Response(
      JSON.stringify({ success: true, data: ownershipData }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    let errorMessage = 'Failed to fetch ownership stats';
    let errorDetails = error.message;
    let statusCode = 500;

    // Specific error handling
    if (error.message.includes('configuration incomplete')) {
      statusCode = 503;
      errorMessage = 'Service configuration error';
    } else if (error.message.includes('No ownership data found')) {
      statusCode = 404;
      errorMessage = 'No data available';
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: errorDetails
      }),
      {
        headers: corsHeaders,
        status: statusCode
      }
    );

  } finally {
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