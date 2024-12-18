import { getSupabaseClient } from './client.ts';
import { getEventDetails } from './events.ts';
import { getFixtureStatus } from './fixtures.ts';
import { getLastUpdate } from './performance.ts';

export async function shouldProcessGameweek(supabaseClient: any, eventId: number): Promise<boolean> {
  try {
    console.log(`Checking if gameweek ${eventId} should be processed...`);
    
    const event = await getEventDetails(supabaseClient, eventId);
    const now = new Date();
    const deadlineTime = new Date(event.deadline_time);
    
    // If the gameweek is finished, we don't need to process it
    if (event.finished) {
      console.log(`Gameweek ${eventId} is finished, no need to process`);
      return false;
    }

    // If we're before the deadline, don't process
    if (now < deadlineTime) {
      console.log(`Current time is before gameweek ${eventId} deadline, no need to process`);
      return false;
    }

    const { hasActiveFixtures, allFixturesFinished } = await getFixtureStatus(supabaseClient, eventId);

    // If any fixture is started but not finished, we should process
    if (hasActiveFixtures) {
      console.log(`Gameweek ${eventId} has active fixtures, should process`);
      return true;
    }

    // If all fixtures are finished, check if we need one final update
    if (allFixturesFinished) {
      const lastUpdate = await getLastUpdate(supabaseClient, eventId);
      
      // If we haven't updated in the last hour after all fixtures finished,
      // do one final update
      if (!lastUpdate?.last_updated || 
          (now.getTime() - new Date(lastUpdate.last_updated).getTime() > 60 * 60 * 1000)) {
        console.log(`Performing final update for gameweek ${eventId}`);
        return true;
      }
    }

    console.log(`No processing needed for gameweek ${eventId}`);
    return false;
  } catch (error) {
    console.error('Error checking if gameweek should be processed:', error);
    return false;
  }
}