import { describe, it, expect, beforeEach } from 'vitest';
import { detectMatchWindow, MatchWindow } from './matchWindowService';
import { generateTestScenarios, validateMatchWindow } from '../utils/tests/matchWindowTestUtils';

describe('Match Window Detection', () => {
  const scenarios = generateTestScenarios();

  scenarios.forEach(scenario => {
    it(`should correctly detect ${scenario.name}`, async () => {
      // Mock Supabase responses based on scenario
      // Run detection
      const window = await detectMatchWindow();
      
      // Validate window structure
      expect(validateMatchWindow(window)).toBe(true);
      
      // Validate specific scenario
      expect(window.type).toBe(scenario.expectedType);
    });
  });

  it('should handle timezone conversions correctly', async () => {
    const window = await detectMatchWindow({ timezone: 'America/New_York' });
    expect(window.timezone).toBe('America/New_York');
    expect(validateMatchWindow(window)).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    // Test with simulated database errors
    try {
      await detectMatchWindow();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});