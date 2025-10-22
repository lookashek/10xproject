/**
 * DELETE /api/auth/delete-account
 *
 * Endpoint do trwałego usunięcia konta użytkownika
 * Wymaga uwierzytelnienia - użytkownik musi być zalogowany
 * 
 * UWAGA: Ta operacja jest nieodwracalna i usuwa:
 * - Konto użytkownika z Supabase Auth
 * - Wszystkie powiązane dane (fiszki, generacje, etc.) przez CASCADE DELETE
 */

import type { APIContext } from "astro";
import { unauthorized, internalServerError, successResponse } from "@/lib/utils/errors";

export const prerender = false;

/**
 * DELETE /api/auth/delete-account
 *
 * Success Response (200):
 * {
 *   message: string;
 * }
 *
 * Error Responses:
 * - 401: Brak autoryzacji
 * - 500: Błąd serwera
 */
export async function DELETE({ locals }: APIContext) {
  try {
    // Sprawdź czy użytkownik jest zalogowany
    if (!locals.user) {
      return unauthorized("Musisz być zalogowany aby usunąć konto");
    }

    // Usuń użytkownika używając funkcji RPC
    // Funkcja delete_user_account() jest bezpieczna (security definer)
    // i automatycznie używa auth.uid() aby zapewnić że użytkownik usuwa tylko swoje konto
    const { error: deleteError } = await locals.supabase.rpc("delete_user_account");

    if (deleteError) {
      console.error("Failed to delete user account:", deleteError);
      return internalServerError(
        "Nie udało się usunąć konta. Spróbuj ponownie później."
      );
    }

    // Wyloguj użytkownika (cleanup sesji)
    await locals.supabase.auth.signOut();

    // Sukces
    return successResponse(
      {
        message: "Konto zostało trwale usunięte",
      },
      200
    );
  } catch (error) {
    console.error("Error in DELETE /api/auth/delete-account:", error);
    return internalServerError("Błąd serwera");
  }
}

