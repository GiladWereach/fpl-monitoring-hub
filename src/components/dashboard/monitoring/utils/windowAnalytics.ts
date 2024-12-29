import { supabase } from "@/integrations/supabase/client";

export interface WindowAnalytics {
  totalWindows: number;
  averageDuration: number;
  errorRate: number;
  matchDensity: number;
}

export async function getHistoricalAnalytics(days: number = 7): Promise<WindowAnalytics> {
  console.log(`Fetching historical analytics for last ${days} days`);
  
  try {
    const { data: windows, error } = await supabase
      .from('match_window_states')
      .select('*')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (!windows?.length) {
      return {
        totalWindows: 0,
        averageDuration: 0,
        errorRate: 0,
        matchDensity: 0
      };
    }

    const totalWindows = windows.length;
    const durations = windows.map(w => 
      new Date(w.end_time).getTime() - new Date(w.start_time).getTime()
    );
    const averageDuration = durations.reduce((a, b) => a + b, 0) / totalWindows;
    const errorCount = windows.filter(w => w.metadata?.error).length;
    const totalMatches = windows.reduce((sum, w) => sum + (w.active_fixtures || 0), 0);

    return {
      totalWindows,
      averageDuration: averageDuration / (1000 * 60), // Convert to minutes
      errorRate: (errorCount / totalWindows) * 100,
      matchDensity: totalMatches / totalWindows
    };
  } catch (error) {
    console.error('Error fetching historical analytics:', error);
    throw error;
  }
}