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
    
    // Construct MongoDB Atlas connection string
    const uri = config.uri || 
      `mongodb+srv://${config.username}:${config.password}@${config.cluster}.mongodb.net/?retryWrites=true&w=majority`;
    
    console.log('Connection string format:', uri.replace(/:[^:@]+@/, ':****@'));
    
    // Create client with default options
    const client = new MongoClient();
    
    // Connect using MongoDB's recommended method
    await client.connect(uri);
    
    // Simple connection test
    const db = client.database('admin');
    const result = await db.command({ ping: 1 });
    
    if (result?.ok !== 1) {
      throw new Error('Ping command failed');
    }
    
    console.log('MongoDB connection successful:', { ok: result.ok });
    return client;
  } catch (error) {
    console.error('MongoDB connection error:', {
      name: error.name,
      message: error.message,
      code: error?.code,
      errorType: error?.constructor?.name
    });
    throw error;
  }
}