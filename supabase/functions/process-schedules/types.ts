export interface Schedule {
  id: string;
  function_name: string;
  next_execution_at: string | null;
  group_name: string;
  frequency_type: 'fixed_interval' | 'match_dependent' | 'daily';
}