import { LivePlayerData, LivePerformanceUpdate } from './types.ts';

export function mapPlayerDataToUpdate(
  element: LivePlayerData,
  eventId: number
): LivePerformanceUpdate {
  const fixtureId = element.explain?.[0]?.fixture || null;
  console.log(`Processing player ${element.id} with fixture ${fixtureId}`);

  return {
    event_id: eventId,
    player_id: element.id,
    fixture_id: fixtureId,
    modified: true,
    in_dreamteam: element.in_dreamteam,
    minutes: element.stats.minutes,
    total_points: element.stats.total_points,
    goals_scored: element.stats.goals_scored,
    assists: element.stats.assists,
    clean_sheets: element.stats.clean_sheets,
    goals_conceded: element.stats.goals_conceded,
    own_goals: element.stats.own_goals,
    penalties_saved: element.stats.penalties_saved,
    penalties_missed: element.stats.penalties_missed,
    yellow_cards: element.stats.yellow_cards,
    red_cards: element.stats.red_cards,
    saves: element.stats.saves,
    bonus: element.stats.bonus,
    bps: element.stats.bps,
    influence: parseFloat(element.stats.influence),
    creativity: parseFloat(element.stats.creativity),
    threat: parseFloat(element.stats.threat),
    ict_index: parseFloat(element.stats.ict_index),
    starts: element.stats.starts,
    expected_goals: parseFloat(element.stats.expected_goals),
    expected_assists: parseFloat(element.stats.expected_assists),
    expected_goal_involvements: parseFloat(element.stats.expected_goal_involvements),
    expected_goals_conceded: parseFloat(element.stats.expected_goals_conceded),
    last_updated: new Date().toISOString()
  };
}

export function shouldSkipUpdate(lastUpdate: any): boolean {
  if (!lastUpdate?.last_updated) return false;
  
  const lastUpdateTime = new Date(lastUpdate.last_updated);
  const timeSinceLastUpdate = Date.now() - lastUpdateTime.getTime();
  const thirtyMinutesInMs = 30 * 60 * 1000;

  return timeSinceLastUpdate < thirtyMinutesInMs;
}