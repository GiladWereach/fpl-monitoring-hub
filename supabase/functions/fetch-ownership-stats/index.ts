import { serve } from "std/server";
import { MongoClient } from "mongodb";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

async function getMongoClient(): Promise<MongoClient> {
  const username = Deno.env.get('MONGODB_USERNAME');
  const password = Deno.env.get('MONGODB_PASSWORD');
  const cluster = Deno.env.get('MONGODB_CLUSTER');
  const dbName = Deno.env.get('MONGODB_DATABASE');

  console.log('Configuration check:', {
    username: username ? `${username.substring(0, 2)}...` : 'missing',
    passwordLength: password?.length || 'missing',
    cluster: cluster || 'missing',
    dbName: dbName || 'missing'
  });

  if (!username || !password || !cluster || !dbName) {
    throw new Error('MongoDB configuration incomplete');
  }

  const encodedUsername = encodeURIComponent(username);
  const encodedPassword = encodeURIComponent(password);
  
  const uri = `mongodb+srv://${encodedUsername}:${encodedPassword}@${cluster}.jeuit.mongodb.net/${dbName}?retryWrites=true&w=majority`;
  console.log('Connecting to MongoDB with URI pattern:', uri.replace(encodedUsername, '***').replace(encodedPassword, '***'));
  
  const client = new MongoClient();
  try {
    console.log('Attempting MongoDB connection...');
    await client.connect(uri);
    console.log('MongoDB connection successful!');
    return client;
  } catch (error) {
    console.error('MongoDB connection error:', {
      name: error.name,
      message: error.message,
      cause: error.cause
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

  console.log(`Retrieved ${ownershipData.length} ownership records`);

  return {
    event: latestEvent,
    ownership_data: ownershipData.map(stat => ({
      ...stat,
      ownership_percentage: Number(stat.ownership_percentage.toFixed(2)),
      captain_percentage: Number(stat.captain_percentage.toFixed(2))
    }))
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
    
    let errorMessage = 'Failed to fetch ownership stats';
    let errorDetails = error.message;
    let statusCode = 500;

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