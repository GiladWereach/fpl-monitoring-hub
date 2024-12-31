export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const fplHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://fantasy.premierleague.com/',
  'Origin': 'https://fantasy.premierleague.com',
  'Connection': 'keep-alive',
};

export const getFplRequestInit = (options: RequestInit = {}): RequestInit => ({
  ...options,
  headers: {
    ...fplHeaders,
    ...options.headers,
  },
});