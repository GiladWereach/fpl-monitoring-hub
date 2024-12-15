export async function fetchLiveGameweekData(gameweekId: number): Promise<{ elements: LivePlayerData[] }> {
  console.log(`Fetching live data for gameweek ${gameweekId}`);
  
  try {
    const response = await fetch(
      `https://fantasy.premierleague.com/api/event/${gameweekId}/live/`,
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
      console.error(`FPL API error: ${response.status}`, await response.text());
      throw new Error(`FPL API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched live data for ${data.elements.length} players`);
    return data;
  } catch (error) {
    console.error('Error fetching live gameweek data:', error);
    throw error;
  }
}