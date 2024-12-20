iimport { MongoClient } from 'https://deno.land/x/mongo@v0.31.1/mod.ts';

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
    `mongodb+srv://${config.username}:${config.password}@${config.cluster}.jeuit.mongodb.net/?authSource=admin&retryWrites=true&w=majority`;

  console.log('Creating MongoDB client...');
  console.log('Using cluster:', config.cluster);
  
  try {
    const client = new MongoClient();
    await client.connect(uri);
    console.log('MongoDB client created successfully');
    return client;
  } catch (error) {
    console.error('Error creating MongoDB client:', error);
    throw new Error(`Failed to create MongoDB client: ${error.message}`);
  }
}
