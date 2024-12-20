interface MongoDBConfig {
  uri?: string;
  cluster: string;
  database: string;
  username: string;
  password: string;
}

export async function validateMongoDBConfig(): Promise<MongoDBConfig> {
  const config = {
    uri: Deno.env.get('MONGODB_URI'),
    cluster: Deno.env.get('MONGODB_CLUSTER'),
    database: Deno.env.get('MONGODB_DATABASE'),
    username: Deno.env.get('MONGODB_USERNAME'),
    password: Deno.env.get('MONGODB_PASSWORD'),
  };

  console.log('Validating MongoDB configuration...');

  // Check for required fields
  const requiredFields = ['cluster', 'database', 'username', 'password'];
  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required MongoDB configuration: ${missingFields.join(', ')}`);
  }

  return config as MongoDBConfig;
}