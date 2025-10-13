/**
 * POST /api/auth/reset-password
 * 
 * Endpoint do ustawienia nowego hasła po kliknięciu linku z emaila
 * Wymaga aktywnej sesji z tokenem resetującym (user już kliknął link w emailu)
 */

import type { APIContext } from 'astro';
import { resetPasswordSchema } from '@/lib/validation/auth.schemas';
import { 
  badRequest,
  unauthorized,
  unprocessableEntity,
  internalServerError, 
  successResponse 
} from '@/lib/utils/errors';
import { mapSupabaseAuthError, isAuthError } from '@/lib/utils/auth-errors';

export const prerender = false;

/**
 * POST /api/auth/reset-password
 * 
 * Request Body:
 * {
 *   password: string;
 * }
 * 
 * Success Response (200):
 * {
 *   message: string;
 * }
 * 
 * Error Responses:
 * - 400: Błąd walidacji
 * - 401: Brak aktywnej sesji (user nie kliknął linku lub link wygasł)
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
      return badRequest('Nieprawidłowe dane żądania');
    }

    // Validate input
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return badRequest(firstError.message, {
        field: firstError.path[0]?.toString(),
      });
    }

    const { password } = validation.data;

    // Sprawdź czy użytkownik ma aktywną sesję (po kliknięciu linku z emaila)
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session) {
      return unauthorized('Link resetujący wygasł lub jest nieprawidłowy. Spróbuj ponownie.');
    }

    // Update password for authenticated user
    const { error } = await locals.supabase.auth.updateUser({
      password,
    });

    // Handle errors
    if (error) {
      if (isAuthError(error)) {
        const mappedError = mapSupabaseAuthError(error);
        
        if (mappedError.code === 'UNPROCESSABLE_ENTITY') {
          return unprocessableEntity(mappedError.message);
        } else {
          return internalServerError(mappedError.message);
        }
      }
      
      console.error('Reset password error:', error);
      return internalServerError('Wystąpił błąd podczas resetowania hasła');
    }

    // Return success response
    return successResponse({
      message: 'Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować.',
    }, 200);

  } catch (error) {
    console.error('Unexpected error in POST /api/auth/reset-password:', error);
    return internalServerError('Błąd serwera');
  }
}

