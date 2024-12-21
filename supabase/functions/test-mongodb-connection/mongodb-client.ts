import { MongoClient } from 'https://deno.land/x/mongo@v0.31.1/mod.ts';

interface MongoDBConfig {
  uri?: string;
  cluster: string;
  database: string;
  username: string;
  password: string;
}

export async function createMongoDBClient(config: MongoDBConfig): Promise<MongoClient> {
  // Construct URI if not provided
  const uri = config.uri || 
    `mongodb+srv://${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@${config.cluster}.jeuit.mongodb.net/?retryWrites=true&w=majority&appName=fplbackend`;

  console.log('Creating MongoDB client...');
  console.log('Using cluster:', config.cluster);
  
  try {
    const client = new MongoClient();
    
    // Connect with recommended options
    await client.connect(uri, {
      tls: true,
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true
      }
    });
    
    // Test connection with ping
    const adminDb = client.database('admin');
    await adminDb.command({ ping: 1 });
    
    console.log('MongoDB client created and tested successfully');
    return client;
  } catch (error) {
    console.error('Error creating MongoDB client:', error);
    throw new Error(`Failed to create MongoDB client: ${error.message}`);
  }
}