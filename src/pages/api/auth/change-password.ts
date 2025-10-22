/**
 * POST /api/auth/change-password
 *
 * Endpoint do zmiany hasła użytkownika
 * Wymaga uwierzytelnienia - użytkownik musi być zalogowany
 */

import type { APIContext } from "astro";
import { changePasswordSchema } from "@/lib/validation/auth.schemas";
import { badRequest, unauthorized, internalServerError, successResponse } from "@/lib/utils/errors";
import { mapSupabaseAuthError, isAuthError } from "@/lib/utils/auth-errors";

export const prerender = false;

/**
 * POST /api/auth/change-password
 *
 * Request Body:
 * {
 *   currentPassword: string;
 *   newPassword: string;
 * }
 *
 * Success Response (200):
 * {
 *   message: string;
 * }
 *
 * Error Responses:
 * - 400: Błąd walidacji
 * - 401: Brak autoryzacji lub nieprawidłowe obecne hasło
 * - 429: Rate limit
 * - 500: Błąd serwera
 */
export async function POST({ request, locals }: APIContext) {
  try {
    // Sprawdź czy użytkownik jest zalogowany
    if (!locals.user) {
      return unauthorized("Musisz być zalogowany aby zmienić hasło");
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Nieprawidłowe dane żądania");
    }

    // Validate input
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return badRequest(firstError.message, {
        field: firstError.path[0]?.toString(),
      });
    }

    const { currentPassword, newPassword } = validation.data;

    // Weryfikacja obecnego hasła poprzez próbę logowania
    // To zapewnia bezpieczeństwo - użytkownik musi znać obecne hasło
    const { error: verifyError } = await locals.supabase.auth.signInWithPassword({
      email: locals.user.email,
      password: currentPassword,
    });

    if (verifyError) {
      // Sprawdź czy to błąd nieprawidłowego hasła
      if (isAuthError(verifyError)) {
        const mappedError = mapSupabaseAuthError(verifyError);
        
        if (mappedError.code === "UNAUTHORIZED") {
          return unauthorized("Nieprawidłowe obecne hasło");
        } else if (mappedError.code === "RATE_LIMIT_EXCEEDED") {
          return internalServerError(mappedError.message);
        }
      }
      
      return unauthorized("Nieprawidłowe obecne hasło");
    }

    // Zmień hasło na nowe
    const { error: updateError } = await locals.supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      if (isAuthError(updateError)) {
        const mappedError = mapSupabaseAuthError(updateError);
        return internalServerError(mappedError.message);
      }
      
      return internalServerError("Nie udało się zmienić hasła");
    }

    // Sukces
    return successResponse(
      {
        message: "Hasło zostało pomyślnie zmienione",
      },
      200
    );
  } catch {
    return internalServerError("Błąd serwera");
  }
}

