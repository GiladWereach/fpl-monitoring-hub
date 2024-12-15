export interface CalculationType {
  id: number;
  name: string;
  description: string | null;
  priority: number;
  is_real_time: boolean;
  category: string;
  update_frequency: string | null;
  requires_cache: boolean;
  dependent_tables: string[] | null;
  created_at: string;
  last_modified: string;
}