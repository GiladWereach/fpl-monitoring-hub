interface MongoDBConfig {
  uri?: string;
  cluster: string;
  database: string;
  username: string;
  password: string;
}

export async function validateMongoDBConfig(): Promise<MongoDBConfig> {
  console.log('Starting MongoDB configuration validation...');
  
  const config = {
    uri: Deno.env.get('MONGODB_URI'),
    cluster: Deno.env.get('MONGODB_CLUSTER'),
    database: Deno.env.get('MONGODB_DATABASE'),
    username: Deno.env.get('MONGODB_USERNAME'),
    password: Deno.env.get('MONGODB_PASSWORD'),
  };

  // Log config (without sensitive data)
  console.log('MongoDB configuration:', {
    uri: config.uri ? '[REDACTED]' : undefined,
    cluster: config.cluster,
    database: config.database,
    username: '[REDACTED]',
    password: '[REDACTED]'
  });

  // Check for required fields
  const requiredFields = ['cluster', 'database', 'username', 'password'];
  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required MongoDB configuration: ${missingFields.join(', ')}`);
  }

  // Basic validation
  if (!config.cluster) {
    throw new Error('MongoDB cluster name is required');
  }

  if (!config.database) {
    throw new Error('MongoDB database name is required');
  }

  if (!config.username || !config.password) {
    throw new Error('MongoDB credentials are required');
  }

  return config as MongoDBConfig;
}