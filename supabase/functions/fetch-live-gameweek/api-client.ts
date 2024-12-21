export async function fetchLiveGameweekData(gameweekId: number): Promise<{ elements: LivePlayerData[] }> {
  console.log(`Fetching live data for gameweek ${gameweekId}`);
  const url = `https://fantasy.premierleague.com/api/event/${gameweekId}/live/`;
  
  try {
    const response = await fetch(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Origin': 'https://fantasy.premierleague.com',
          'Referer': 'https://fantasy.premierleague.com/',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Connection': 'keep-alive'
        }
      }
    );

    if (!response.ok) {
      // Read error response once and store it
      const errorBody = await response.text();
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url: url,
        timestamp: new Date().toISOString()
      };
      
      console.error('FPL API error details:', errorDetails);
      throw new Error(`FPL API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched live data for ${data.elements.length} players`);
    return data;
  } catch (error) {
    // Enhanced error logging with context
    const errorContext = {
      gameweekId,
      timestamp: new Date().toISOString(),
      url: url,
      errorType: error.name,
      errorMessage: error.message,
      stack: error.stack
    };
    
    console.error('Error in fetchLiveGameweekData:', errorContext);
    throw error; // Re-throw to be handled by the execution logger
  }
}