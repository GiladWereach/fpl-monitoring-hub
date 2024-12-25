import { MatchWindow } from '@/services/matchWindowService';

export const createMockFixture = (
  kickoffTime: Date,
  started: boolean = false,
  finished: boolean = false
) => ({
  id: Math.random(),
  kickoff_time: kickoffTime.toISOString(),
  started,
  finished,
  team_h: 1,
  team_a: 2,
  team_h_score: 0,
  team_a_score: 0
});

export const validateMatchWindow = (window: MatchWindow | null): boolean => {
  if (!window) return false;
  
  // Basic validation
  if (!window.start || !window.end) return false;
  if (window.start >= window.end) return false;
  
  // Type validation
  if (!['pre', 'live', 'post', 'idle'].includes(window.type)) return false;
  
  // Time window validation
  const now = new Date();
  const maxWindowDuration = 4 * 60 * 60 * 1000; // 4 hours
  if (window.end.getTime() - window.start.getTime() > maxWindowDuration) return false;
  
  return true;
};

export const generateTestScenarios = () => {
  const now = new Date();
  return [
    {
      name: 'Pre-match window',
      fixtures: [createMockFixture(new Date(now.getTime() + 30 * 60 * 1000))],
      expectedType: 'pre'
    },
    {
      name: 'Live match window',
      fixtures: [createMockFixture(now, true, false)],
      expectedType: 'live'
    },
    {
      name: 'Post-match window',
      fixtures: [createMockFixture(new Date(now.getTime() - 120 * 60 * 1000), true, true)],
      expectedType: 'post'
    },
    {
      name: 'Multiple active matches',
      fixtures: [
        createMockFixture(now, true, false),
        createMockFixture(new Date(now.getTime() + 45 * 60 * 1000), true, false)
      ],
      expectedType: 'live'
    }
  ];
};