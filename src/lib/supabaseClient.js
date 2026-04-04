import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://epntrbtvqpuoauytzrhf.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_DwYSU24CcMJjOHvGT5cT0Q_bEDeEgN3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
