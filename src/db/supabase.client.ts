import { createClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

// Dla użycia po stronie serwera (middleware, API routes)
const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY || import.meta.env.PUBLIC_SUPABASE_KEY;

// Dla użycia po stronie klienta (React hooks)
// Wymaga zmiennych z prefixem PUBLIC_
const supabaseUrlClient = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKeyClient = import.meta.env.PUBLIC_SUPABASE_KEY;

/**
 * Supabase client z konfiguracją auth
 * Używany zarówno po stronie serwera (middleware, API) jak i klienta (React)
 */
export const supabaseClient = createClient<Database>(
  supabaseUrl || supabaseUrlClient, 
  supabaseAnonKey || supabaseAnonKeyClient,
  {
    auth: {
      // Automatyczne zarządzanie sesjami
      autoRefreshToken: true,
      
      // Persist sesji w localStorage (dla klienta) i cookies (dla serwera)
      persistSession: true,
      
      // Wykrywanie zmian sesji w URL (dla email verification - przyszłość)
      detectSessionInUrl: true,
      
      // Storage dla tokenów - localStorage w browser, undefined w SSR
      storage: typeof window !== 'undefined' 
        ? window.localStorage 
        : undefined,
    }
  }
);

export type SupabaseClient = typeof supabaseClient;

