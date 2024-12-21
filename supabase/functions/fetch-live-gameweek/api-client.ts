import { logDebug, logError } from './logging.ts';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Connection': 'keep-alive',
  'Origin': 'https://fantasy.premierleague.com',
  'Referer': 'https://fantasy.premierleague.com/',
  'Host': 'fantasy.premierleague.com'
};

export async function fetchLiveGameweekData(gameweekId: number) {
  logDebug('fetch-live-gameweek', `Fetching live data for gameweek ${gameweekId}`);
  const url = `https://fantasy.premierleague.com/api/event/${gameweekId}/live/`;
  
  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorBody = await response.text();
      logError('fetch-live-gameweek', 'FPL API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url: url
      });
      throw new Error(`FPL API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    logDebug('fetch-live-gameweek', `Successfully fetched live data for ${data.elements.length} players`);
    return data;
  } catch (error) {
    logError('fetch-live-gameweek', 'Error fetching live gameweek data:', error);
    throw error;
  }
}