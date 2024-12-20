import { supabase } from "@/integrations/supabase/client";
import { OwnershipResponse } from "@/types/ownership";

export async function getCurrentOwnership(): Promise<OwnershipResponse> {
  console.log('Fetching current ownership stats');
  const { data, error } = await supabase.functions.invoke<OwnershipResponse>('fetch-ownership-stats');
  
  if (error) {
    console.error('Error fetching ownership stats:', error);
    throw error;
  }

  if (!data.success) {
    console.error('Ownership stats fetch failed:', data.error, data.details);
    throw new Error(data.error || 'Failed to fetch ownership data');
  }

  return data;
}