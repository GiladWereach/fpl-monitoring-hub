export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const validateAuth = (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.error('Missing Authorization header');
    throw new Error('Missing authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const validToken = Deno.env.get('ANON_KEY');
  
  console.log('Validating authorization token...');
  if (!validToken) {
    console.error('ANON_KEY environment variable is not set');
    throw new Error('Server configuration error');
  }

  if (token !== validToken) {
    console.error('Invalid authorization token');
    throw new Error('Invalid authorization token');
  }

  return token;
};