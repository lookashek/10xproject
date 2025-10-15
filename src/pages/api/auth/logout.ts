/**
 * POST /api/auth/logout
 *
 * Endpoint do wylogowania użytkownika
 * Kończy sesję Supabase i usuwa cookies
 */

import type { APIContext } from "astro";
import { internalServerError, successResponse } from "@/lib/utils/errors";

export const prerender = false;

/**
 * POST /api/auth/logout
 *
 * Request: Brak body
 *
 * Success Response (200):
 * {
 *   message: string;
 * }
 *
 * Error Responses:
 * - 500: Błąd serwera
 */
export async function POST({ locals }: APIContext) {
  try {
    // Sign out from Supabase (clears session and cookies)
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return internalServerError("Nie udało się wylogować");
    }

    // Return success
    return successResponse(
      {
        message: "Wylogowano pomyślnie",
      },
      200
    );
  } catch (error) {
    console.error("Unexpected error in POST /api/auth/logout:", error);
    return internalServerError("Błąd serwera");
  }
}
