import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://agawgutsvfggpukphiuf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYXdndXRzdmZnZ3B1a3BoaXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODkxODcsImV4cCI6MjA5Njg2NTE4N30.j01v2ntx0D0aM6JdSi98l1RMITpGa0phzpYrGQA7MMU';

export const supabase = createClient(supabaseUrl, supabaseKey);
