/**
 * POST /api/auth/register
 *
 * Endpoint do rejestracji nowego użytkownika
 * MVP: Auto-confirm users (bez email verification)
 * Po sukcesie użytkownik jest automatycznie zalogowany
 */

import type { APIContext } from "astro";
import { registerSchema } from "@/lib/validation/auth.schemas";
import { badRequest, conflict, unprocessableEntity, internalServerError, successResponse } from "@/lib/utils/errors";
import { mapSupabaseAuthError, isAuthError } from "@/lib/utils/auth-errors";

export const prerender = false;

/**
 * POST /api/auth/register
 *
 * Request Body:
 * {
 *   email: string;
 *   password: string;
 * }
 *
 * Success Response (201):
 * {
 *   user: {
 *     id: string;
 *     email: string;
 *   },
 *   message: string;
 * }
 *
 * Error Responses:
 * - 400: Błąd walidacji
 * - 409: Email już istnieje
 * - 422: Słabe hasło
 * - 500: Błąd serwera
 */
export async function POST({ request, locals }: APIContext) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Nieprawidłowe dane żądania");
    }

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return badRequest(firstError.message, {
        field: firstError.path[0]?.toString(),
      });
    }

    const { email, password } = validation.data;

    // Attempt registration with Supabase
    // MVP: Auto-confirm users (emailRedirectTo: null, auto-confirm w Supabase Dashboard)
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        // MVP: Bez email verification
        emailRedirectTo: undefined,
      },
    });

    // Handle authentication errors
    if (error) {
      if (isAuthError(error)) {
        const mappedError = mapSupabaseAuthError(error);

        if (mappedError.code === "CONFLICT") {
          return conflict(mappedError.message);
        } else if (mappedError.code === "UNPROCESSABLE_ENTITY") {
          return unprocessableEntity(mappedError.message);
        } else {
          return internalServerError(mappedError.message);
        }
      }

      console.error("Registration error:", error);
      return internalServerError("Wystąpił błąd podczas rejestracji");
    }

    // Check if user was created
    if (!data.user) {
      return internalServerError("Nie udało się utworzyć konta");
    }

    // MVP: Auto-login - Supabase tworzy sesję automatycznie gdy auto-confirm = ON
    // Session już istnieje w cookies dzięki Supabase

    // Return success response
    return successResponse(
      {
        user: {
          id: data.user.id,
          email: data.user.email!,
        },
        message: "Rejestracja pomyślna. Jesteś zalogowany.",
      },
      201
    );
  } catch (error) {
    console.error("Unexpected error in POST /api/auth/register:", error);
    return internalServerError("Błąd serwera");
  }
}
