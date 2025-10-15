import { createClient, type SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

/**
 * Funkcja pomocnicza do pobierania zmiennych środowiskowych
 * Obsługuje zarówno process.env (Node.js/CI) jak i import.meta.env (Astro build)
 */
function getEnvVar(key: string): string | undefined {
  // Najpierw sprawdź process.env (priorytet dla CI/testów)
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  // Fallback do import.meta.env (Astro build-time)
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  return undefined;
}

/**
 * Tworzy nowy Supabase client
 */
function createSupabaseClient(): SupabaseClientType<Database> {
  // Dla użycia po stronie serwera (middleware, API routes)
  const supabaseUrl = getEnvVar("SUPABASE_URL") || getEnvVar("PUBLIC_SUPABASE_URL");
  const supabaseAnonKey =
    getEnvVar("SUPABASE_KEY") || getEnvVar("PUBLIC_SUPABASE_KEY") || getEnvVar("PUBLIC_SUPABASE_ANON_KEY");

  // Dla użycia po stronie klienta (React hooks)
  const supabaseUrlClient = getEnvVar("PUBLIC_SUPABASE_URL");
  const supabaseAnonKeyClient = getEnvVar("PUBLIC_SUPABASE_KEY") || getEnvVar("PUBLIC_SUPABASE_ANON_KEY");

  const finalUrl = supabaseUrl || supabaseUrlClient;
  const finalKey = supabaseAnonKey || supabaseAnonKeyClient;

  if (!finalUrl || !finalKey) {
    throw new Error(
      "Missing Supabase configuration. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY (or PUBLIC_SUPABASE_ANON_KEY) environment variables."
    );
  }

  return createClient<Database>(finalUrl, finalKey, {
    auth: {
      // Automatyczne zarządzanie sesjami
      autoRefreshToken: true,

      // Persist sesji w localStorage (dla klienta) i cookies (dla serwera)
      persistSession: true,

      // Wykrywanie zmian sesji w URL (dla email verification - przyszłość)
      detectSessionInUrl: true,

      // Storage dla tokenów - localStorage w browser, undefined w SSR
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  });
}

/**
 * Supabase client z konfiguracją auth
 * Używany zarówno po stronie serwera (middleware, API) jak i klienta (React)
 *
 * Używa lazy initialization żeby zmienne env były dostępne w czasie tworzenia
 */
export const supabaseClient = createSupabaseClient();

export type SupabaseClient = typeof supabaseClient;
