/**
 * API endpoint for single generation
 * GET /api/generations/{id} - Get generation details with flashcards
 */

import type { APIContext } from 'astro';
import { generationIdSchema } from '../../../lib/validation/generation.schemas';
import { getGenerationById } from '../../../lib/services/generationService';
import {
  badRequest,
  notFound,
  unauthorized,
  internalServerError,
  successResponse,
} from '../../../lib/utils/errors';

export const prerender = false;

/**
 * GET /api/generations/{id}
 * Returns single generation with associated flashcards
 */
export async function GET({ params, locals }: APIContext) {
  try {
    // Validate ID from URL params
    const validation = generationIdSchema.safeParse(params.id);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      
      // Check if it's a type error (not a number)
      if (firstError.code === 'invalid_type') {
        return badRequest('Invalid generation ID', {
          field: 'id',
        });
      }
      
      // Check if it's a value error (not positive)
      return badRequest('Generation ID must be positive', {
        field: 'id',
        min: 1,
      });
    }

    const generationId = validation.data;

    // Get user ID from auth context (middleware ensures user is authenticated)
    const userId = locals.user?.id;
    if (!userId) {
      return unauthorized('Wymagane zalogowanie');
    }

    // Fetch generation with flashcards
    const generation = await getGenerationById(
      locals.supabase,
      userId,
      generationId
    );

    if (!generation) {
      return notFound('Generation not found');
    }

    return successResponse(generation, 200);

  } catch (error) {
    console.error('Error in GET /api/generations/:id:', error);
    return internalServerError('Database error');
  }
}

