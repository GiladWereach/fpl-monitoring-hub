import { logDebug, logError } from './logging.ts';

const INITIAL_BACKOFF = 1000; // 1 second
const MAX_RETRIES = 3;
const TIMEOUT = 30000;

export const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Connection': 'keep-alive',
  'Origin': 'https://fantasy.premierleague.com',
  'Referer': 'https://fantasy.premierleague.com/',
  'Host': 'fantasy.premierleague.com',
  'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin'
};

export async function fetchWithRetry(url: string, retryCount = 0): Promise<Response> {
  try {
    logDebug('fetch-fixtures', `Attempt ${retryCount + 1}/${MAX_RETRIES} to fetch data from ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(url, { 
      headers,
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    logDebug('fetch-fixtures', `Response status: ${response.status}`);
    logDebug('fetch-fixtures', `Response headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      logDebug('fetch-fixtures', `Content-Type: ${contentType}`);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        logError('fetch-fixtures', `Invalid content type. Response body: ${text}`);
        throw new Error('Invalid content type received from FPL API');
      }
      return response;
    }

    if (response.status === 403 && retryCount < MAX_RETRIES) {
      const backoffTime = INITIAL_BACKOFF * Math.pow(2, retryCount);
      logDebug('fetch-fixtures', `Received 403, retrying in ${backoffTime}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return fetchWithRetry(url, retryCount + 1);
    }

    const errorText = await response.text();
    logError('fetch-fixtures', `FPL API error response: ${errorText}`);
    throw new Error(`FPL API error: ${response.status}. Response: ${errorText}`);
  } catch (error) {
    if (error.name === 'AbortError') {
      logError('fetch-fixtures', 'Request timeout');
      throw new Error('Request timeout');
    }

    if (retryCount < MAX_RETRIES) {
      const backoffTime = INITIAL_BACKOFF * Math.pow(2, retryCount);
      logDebug('fetch-fixtures', `Request failed, retrying in ${backoffTime}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return fetchWithRetry(url, retryCount + 1);
    }
    throw error;
  }
}