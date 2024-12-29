import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = "https://qlkhlcoyrifbvzbqkshu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsa2hsY295cmlmYnZ6YnFrc2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyMDc0NTksImV4cCI6MjA0OTc4MzQ1OX0.X2SNa57FYIjtpuZYBM1zlKn9IkIyrcP1hc9kv5H45GI";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
  },
});