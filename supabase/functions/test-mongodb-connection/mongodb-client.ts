import { MongoClient } from 'https://deno.land/x/mongo@v0.31.1/mod.ts';

interface MongoDBConfig {
  uri?: string;
  cluster: string;
  database: string;
  username: string;
  password: string;
}

export async function createMongoDBClient(config: MongoDBConfig): Promise<MongoClient> {
  const uri = config.uri || 
    `mongodb+srv://${config.username}:${config.password}@${config.cluster}.mongodb.net/?retryWrites=true&w=majority`;

  console.log('Creating MongoDB client...');
  
  return new MongoClient(uri);
}