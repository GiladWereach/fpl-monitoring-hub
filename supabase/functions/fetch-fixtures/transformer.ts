import { FPLFixture, TransformedFixture } from './types';
import { logDebug, logError } from './logging';

export function transformFixture(fixture: FPLFixture): TransformedFixture {
  logDebug('transformer', `Transforming fixture ${fixture.id}`);
  
  try {
    const transformed: TransformedFixture = {
      id: fixture.id,
      code: null, // Will be populated if available
      event: fixture.event,
      kickoff_time: new Date(fixture.kickoff_time).toISOString(),
      minutes: fixture.minutes || 0,
      provisional_start_time: fixture.provisional_start_time || false,
      started: fixture.started || false,
      finished: fixture.finished || false,
      finished_provisional: fixture.finished_provisional || false,
      team_h: fixture.team_h,
      team_h_score: fixture.team_h_score,
      team_h_difficulty: null, // Will be calculated based on team strength
      team_a: fixture.team_a,
      team_a_score: fixture.team_a_score,
      team_a_difficulty: null, // Will be calculated based on team strength
      stats: transformStats(fixture.stats),
      last_updated: new Date().toISOString(),
      processed_for_player_details: false
    };

    logDebug('transformer', `Successfully transformed fixture ${fixture.id}`);
    return transformed;
  } catch (error) {
    logError('transformer', `Error transforming fixture ${fixture.id}:`, error);
    throw new Error(`Transformation failed for fixture ${fixture.id}: ${error.message}`);
  }
}

function transformStats(stats: FPLFixture['stats']): Record<string, any> {
  if (!Array.isArray(stats)) return {};
  
  return stats.reduce((acc, stat) => {
    if (!stat.identifier || !Array.isArray(stat.stats)) return acc;
    
    acc[stat.identifier] = stat.stats.map(s => ({
      element: s.element,
      value: s.value
    }));
    
    return acc;
  }, {} as Record<string, any>);
}

export function validateTransformedData(fixture: TransformedFixture): boolean {
  const requiredFields = [
    'id', 'event', 'team_h', 'team_a', 'kickoff_time',
    'started', 'finished', 'stats', 'last_updated'
  ];

  return requiredFields.every(field => {
    const value = fixture[field as keyof TransformedFixture];
    return value !== undefined && value !== null;
  });
}