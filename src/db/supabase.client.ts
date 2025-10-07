import { createClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

// Dla użycia po stronie serwera (middleware, API routes)
const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY || import.meta.env.PUBLIC_SUPABASE_KEY;

// Dla użycia po stronie klienta (React hooks)
// Wymaga zmiennych z prefixem PUBLIC_
const supabaseUrlClient = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKeyClient = import.meta.env.PUBLIC_SUPABASE_KEY;

// Klient uniwersalny - działa po stronie serwera i klienta
export const supabaseClient = createClient<Database>(
  supabaseUrl || supabaseUrlClient, 
  supabaseAnonKey || supabaseAnonKeyClient
);

