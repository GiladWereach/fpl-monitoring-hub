export async function fetchLiveGameweekData(gameweekId: number): Promise<{ elements: LivePlayerData[] }> {
  console.log(`Fetching live data for gameweek ${gameweekId}`);
  
  const response = await fetch(
    `https://fantasy.premierleague.com/api/event/${gameweekId}/live/`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }
  );

  if (!response.ok) {
    console.error(`FPL API error: ${response.status}`, await response.text());
    throw new Error(`FPL API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`Fetched live data for ${data.elements.length} players`);
  return data;
}