/**
 * Auth Error Mapper - Supabase Auth Error Handling
 *
 * Maps Supabase authentication errors to user-friendly Polish messages
 * with appropriate HTTP status codes and error codes.
 */

import { AuthError } from "@supabase/supabase-js";
import type { ApiErrorCode } from "@/types";

/**
 * Struktura zmapowanego błędu
 */
export interface MappedAuthError {
  code: ApiErrorCode;
  message: string;
}

/**
 * Mapuje błąd Supabase Auth na przyjazny komunikat użytkownika
 *
 * @param error - Błąd zwrócony przez Supabase Auth
 * @returns Zmapowany błąd z kodem i wiadomością
 */
export function mapSupabaseAuthError(error: AuthError): MappedAuthError {
  const errorMessage = error.message.toLowerCase();

  // Email już zarejestrowany
  if (
    errorMessage.includes("already registered") ||
    errorMessage.includes("already exists") ||
    errorMessage.includes("duplicate")
  ) {
    return {
      code: "CONFLICT",
      message: "Użytkownik z tym adresem email już istnieje",
    };
  }

  // Nieprawidłowe dane logowania
  if (
    errorMessage.includes("invalid login credentials") ||
    errorMessage.includes("invalid email or password") ||
    errorMessage.includes("email not confirmed")
  ) {
    return {
      code: "UNAUTHORIZED",
      message: "Nieprawidłowy email lub hasło",
    };
  }

  // Słabe hasło
  if (
    errorMessage.includes("password") &&
    (errorMessage.includes("weak") || errorMessage.includes("short") || errorMessage.includes("strength"))
  ) {
    return {
      code: "UNPROCESSABLE_ENTITY",
      message: "Hasło nie spełnia wymagań bezpieczeństwa",
    };
  }

  // Rate limiting
  if (error.status === 429 || errorMessage.includes("rate limit")) {
    return {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Zbyt wiele prób. Spróbuj ponownie później",
    };
  }

  // Email nie zweryfikowany (jeśli w przyszłości włączymy)
  if (errorMessage.includes("email not confirmed")) {
    return {
      code: "UNAUTHORIZED",
      message: "Email nie został zweryfikowany. Sprawdź swoją skrzynkę pocztową",
    };
  }

  // User not found
  if (errorMessage.includes("user not found")) {
    return {
      code: "UNAUTHORIZED",
      message: "Nieprawidłowy email lub hasło",
    };
  }

  // Session expired
  if (errorMessage.includes("session") && errorMessage.includes("expired")) {
    return {
      code: "UNAUTHORIZED",
      message: "Sesja wygasła. Zaloguj się ponownie",
    };
  }

  // Invalid token/JWT
  if (errorMessage.includes("invalid") && errorMessage.includes("token")) {
    return {
      code: "UNAUTHORIZED",
      message: "Nieprawidłowy token autoryzacji",
    };
  }

  // Default: Internal server error
  return {
    code: "INTERNAL_SERVER_ERROR",
    message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie",
  };
}

/**
 * Sprawdza czy błąd jest błędem Supabase Auth
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
