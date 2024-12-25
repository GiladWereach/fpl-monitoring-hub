import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ScheduleFrequency = {
  intervalMinutes: number;
  startTime?: string;
  endTime?: string;
};

export async function determineScheduleFrequency(functionName: string): Promise<ScheduleFrequency> {
  console.log(`Determining schedule frequency for ${functionName}`);
  
  // Get current gameweek status
  const { data: currentEvent } = await supabase
    .from('events')
    .select('*')
    .eq('is_current', true)
    .single();

  if (!currentEvent) {
    console.log('No current gameweek found, using daily collection');
    return { intervalMinutes: 1440 }; // 24 hours
  }

  // Get today's fixtures
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*')
    .eq('event', currentEvent.id)
    .gte('kickoff_time', today.toISOString())
    .lt('kickoff_time', tomorrow.toISOString())
    .order('kickoff_time');

  if (!fixtures?.length) {
    // No matches today, check if gameweek is live
    const { data: unfinishedFixtures } = await supabase
      .from('fixtures')
      .select('*')
      .eq('event', currentEvent.id)
      .eq('finished', false);

    if (unfinishedFixtures?.length) {
      console.log('Live gameweek (non-match hours), using 30-minute intervals');
      return { intervalMinutes: 30 };
    }

    console.log('No live matches, using daily collection');
    return { intervalMinutes: 1440 }; // 24 hours
  }

  // We have matches today, determine the window
  const firstKickoff = new Date(fixtures[0].kickoff_time);
  const lastKickoff = new Date(fixtures[fixtures.length - 1].kickoff_time);
  const windowEnd = new Date(lastKickoff);
  windowEnd.setHours(windowEnd.getHours() + 2.5); // 2.5 hours after last kickoff

  const now = new Date();
  if (now >= firstKickoff && now <= windowEnd) {
    console.log('Match day window active, using 2-minute intervals');
    return {
      intervalMinutes: 2,
      startTime: firstKickoff.toISOString(),
      endTime: windowEnd.toISOString()
    };
  }

  console.log('Outside match window, using 30-minute intervals');
  return { intervalMinutes: 30 };
}