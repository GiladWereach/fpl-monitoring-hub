import { corsHeaders } from '../_shared/cors.ts';
import { validateMongoDBConfig } from './config-validator.ts';
import { createMongoDBClient } from './mongodb-client.ts';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting MongoDB connection test...');
    
    // Validate configuration
    const config = await validateMongoDBConfig();
    console.log('MongoDB configuration validated');

    // Create client and test connection
    const client = await createMongoDBClient(config);
    console.log('MongoDB client created successfully');

    try {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'MongoDB connection test successful',
          database: config.database,
          cluster: config.cluster
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } finally {
      await client.close();
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    console.error('MongoDB connection test failed:', {
      error: error.message,
      type: error?.constructor?.name,
      code: error?.code
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        code: error?.code,
        type: error?.constructor?.name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});