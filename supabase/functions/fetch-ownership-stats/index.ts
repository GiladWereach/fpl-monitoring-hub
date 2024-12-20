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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let client: MongoClient | null = null;
  
  try {
    console.log('Starting ownership stats fetch...');

    // Construct MongoDB URI from environment variables
    const username = Deno.env.get('MONGODB_USERNAME');
    const password = Deno.env.get('MONGODB_PASSWORD');
    const cluster = Deno.env.get('MONGODB_CLUSTER');
    const dbName = Deno.env.get('MONGODB_DATABASE');

    if (!username || !password || !cluster || !dbName) {
      throw new Error('MongoDB configuration incomplete');
    }

    const uri = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${cluster}/?retryWrites=true&w=majority`;
    console.log('Connecting to MongoDB...');

    // Initialize client with timeout and retry options
    client = new MongoClient();
    await client.connect({
      db: dbName,
      tls: true,
      servers: [{ host: cluster, port: 27017 }],
      credential: {
        username: username,
        password: password,
        mechanism: "SCRAM-SHA-1"
      }
    });

    console.log('Successfully connected to MongoDB');
    const db = client.database(dbName);

    // Fetch latest ownership stats with timeout
    const ownershipData = await Promise.race([
      fetchLatestOwnershipStats(db),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timeout')), 15000)
      )
    ]);

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
    } else if (error.message.includes('timeout')) {
      statusCode = 504;
      errorMessage = 'Service timeout';
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
    // Ensure MongoDB connection is closed
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