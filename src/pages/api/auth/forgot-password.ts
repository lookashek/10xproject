/**
 * POST /api/auth/forgot-password
 * 
 * Endpoint do wysłania emaila z linkiem resetującym hasło
 * Używa Supabase Auth do wysłania emaila z tokenem
 */

import type { APIContext } from 'astro';
import { forgotPasswordSchema } from '@/lib/validation/auth.schemas';
import { 
  badRequest,
  internalServerError, 
  successResponse 
} from '@/lib/utils/errors';

export const prerender = false;

/**
 * POST /api/auth/forgot-password
 * 
 * Request Body:
 * {
 *   email: string;
 * }
 * 
 * Success Response (200):
 * {
 *   message: string;
 * }
 * 
 * Error Responses:
 * - 400: Błąd walidacji
 * - 500: Błąd serwera
 * 
 * UWAGA: Ze względów bezpieczeństwa zawsze zwracamy sukces,
 * nawet jeśli email nie istnieje w bazie (zapobiega enumeracji użytkowników)
 */
export async function POST({ request, locals }: APIContext) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest('Nieprawidłowe dane żądania');
    }

    // Validate input
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return badRequest(firstError.message, {
        field: firstError.path[0]?.toString(),
      });
    }

    const { email } = validation.data;

    // Get base URL for redirect
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const redirectTo = `${baseUrl}/reset-password`;

    // Send password reset email via Supabase
    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // SECURITY: Nie ujawniamy czy email istnieje w bazie
    // Zawsze zwracamy sukces
    if (error) {
      console.error('Forgot password error:', error);
      // Nie zwracamy błędu użytkownikowi - zapobiega enumeracji
    }

    // Return success response (zawsze)
    return successResponse({
      message: 'Jeśli podany adres email istnieje w naszej bazie, wysłaliśmy na niego link do resetowania hasła.',
    }, 200);

  } catch (error) {
    console.error('Unexpected error in POST /api/auth/forgot-password:', error);
    return internalServerError('Błąd serwera');
  }
}

