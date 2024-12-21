import { MongoClient } from 'https://deno.land/x/mongo@v0.31.1/mod.ts';

interface MongoDBConfig {
  uri?: string;
  cluster: string;
  database: string;
  username: string;
  password: string;
}

export async function createMongoDBClient(config: MongoDBConfig): Promise<MongoClient> {
  try {
    console.log('Creating MongoDB client...');
    console.log('Using cluster:', config.cluster);
    
    // Construct the connection URI with proper encoding
    const uri = config.uri || 
      `mongodb+srv://${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@${config.cluster}.mongodb.net/?retryWrites=true&w=majority`;
    
    console.log('Attempting connection with URI pattern:', uri.replace(/:[^:@]+@/, ':****@'));
    
    const client = new MongoClient();
    
    // Connect with recommended options
    await client.connect(uri);
    
    // Test connection with ping
    const db = client.database(config.database);
    await db.command({ ping: 1 });
    
    console.log('MongoDB client created and tested successfully');
    return client;
  } catch (error) {
    console.error('Error details:', error);
    throw new Error(`Failed to create MongoDB client: ${error.message}`);
  }
}