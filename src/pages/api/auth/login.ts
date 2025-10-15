/**
 * POST /api/auth/login
 *
 * Endpoint do logowania użytkownika
 * Używa Supabase Auth do weryfikacji credentials i tworzenia sesji
 */

import type { APIContext } from "astro";
import { loginSchema } from "@/lib/validation/auth.schemas";
import { badRequest, unauthorized, internalServerError, successResponse } from "@/lib/utils/errors";
import { mapSupabaseAuthError, isAuthError } from "@/lib/utils/auth-errors";

export const prerender = false;

/**
 * POST /api/auth/login
 *
 * Request Body:
 * {
 *   email: string;
 *   password: string;
 * }
 *
 * Success Response (200):
 * {
 *   user: {
 *     id: string;
 *     email: string;
 *   },
 *   redirectTo: string;
 * }
 *
 * Error Responses:
 * - 400: Błąd walidacji
 * - 401: Nieprawidłowe credentials
 * - 429: Rate limit
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
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return badRequest(firstError.message, {
        field: firstError.path[0]?.toString(),
      });
    }

    const { email, password } = validation.data;

    // Attempt login with Supabase
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle authentication errors
    if (error) {
      if (isAuthError(error)) {
        const mappedError = mapSupabaseAuthError(error);

        if (mappedError.code === "UNAUTHORIZED") {
          return unauthorized(mappedError.message);
        } else if (mappedError.code === "RATE_LIMIT_EXCEEDED") {
          return internalServerError(mappedError.message); // lub tooManyRequests jeśli mamy
        } else {
          return internalServerError(mappedError.message);
        }
      }

      // Login error
      return internalServerError("Wystąpił błąd podczas logowania");
    }

    // Check if user data exists
    if (!data.user || !data.session) {
      return unauthorized("Nieprawidłowy email lub hasło");
    }

    // Get redirect URL from query params or default to /dashboard
    const url = new URL(request.url);
    const redirectParam = url.searchParams.get("redirect");
    const redirectTo = redirectParam || "/dashboard";

    // Return success response with session for client-side auth
    return successResponse(
      {
        user: {
          id: data.user.id,
          email: data.user.email ?? "",
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
        redirectTo,
      },
      200
    );
  } catch {
    // Unexpected error in POST /api/auth/login
    return internalServerError("Błąd serwera");
  }
}
