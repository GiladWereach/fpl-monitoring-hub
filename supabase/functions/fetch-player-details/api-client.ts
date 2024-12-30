import { fplHeaders } from '../_shared/fpl-headers.ts';
import { PlayerDetails } from './types.ts';

export async function fetchPlayerDetails(playerId: number): Promise<PlayerDetails> {
  console.log(`Fetching details for player ${playerId}`);
  
  const response = await fetch(
    `https://fantasy.premierleague.com/api/element-summary/${playerId}/`,
    { headers: fplHeaders }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Error fetching player ${playerId}:`, errorText);
    throw new Error(`Failed to fetch player ${playerId}: ${response.status}`);
  }

  return await response.json();
}