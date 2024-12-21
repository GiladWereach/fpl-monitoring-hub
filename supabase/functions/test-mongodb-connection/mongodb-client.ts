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
    
    // Construct the connection string following MongoDB best practices
    const uri = config.uri || 
      `mongodb+srv://${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@${config.cluster}.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    
    console.log('Attempting connection with URI pattern:', uri.replace(/:[^:@]+@/, ':****@'));
    
    // Create client with minimal options
    const client = new MongoClient();
    
    // Connect using the official MongoDB recommended method
    await client.connect(uri);
    
    // Verify connection with a lightweight ping
    const db = client.database('admin');
    await db.command({ ping: 1 });
    
    console.log('MongoDB connection test successful');
    return client;
  } catch (error) {
    console.error('MongoDB connection error:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
}