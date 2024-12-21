import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function checkActiveMatches(supabaseClient: ReturnType<typeof createClient>) {
  console.log('Checking for active matches...');
  
  const { data: activeMatches, error } = await supabaseClient
    .from('fixtures')
    .select('*')
    .eq('started', true)
    .eq('finished', false);

  if (error) {
    console.error('Error checking active matches:', error);
    throw error;
  }

  const hasActiveMatches = activeMatches && activeMatches.length > 0;
  console.log(`Active matches found: ${hasActiveMatches ? 'Yes' : 'No'}`);
  
  return hasActiveMatches;
}