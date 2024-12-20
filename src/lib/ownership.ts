import { supabase } from "@/integrations/supabase/client";

export async function getCurrentOwnership() {
  console.log('Fetching current ownership stats');
  const { data, error } = await supabase.functions.invoke('fetch-ownership-stats');
  
  if (error) {
    console.error('Error fetching ownership stats:', error);
    throw error;
  }

  return data;
}