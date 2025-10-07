/**
 * API endpoint for generations
 * GET /api/generations - List all generations with pagination
 * POST /api/generations - Create new generation from source text
 */

import type { APIContext } from 'astro';
import type { GenerationCreateCommand, GenerationCreateResponse } from '../../../types';
import { generationCreateSchema, generationListQuerySchema } from '../../../lib/validation/generation.schemas';
import { calculateSHA256 } from '../../../lib/services/hashService';
import { generateFlashcards, LLMServiceError } from '../../../lib/services/llmService';
import { logGenerationError } from '../../../lib/services/errorLogService';
import {
  checkDuplicateHash,
  createGeneration,
  listGenerations,
} from '../../../lib/services/generationService';
import {
  badRequest,
  conflict,
  unprocessableEntity,
  internalServerError,
  serviceUnavailable,
  successResponse,
} from '../../../lib/utils/errors';

export const prerender = false;

/**
 * Placeholder user ID for MVP (before auth is implemented)
 * Used as fallback when user is not authenticated
 */
const PLACEHOLDER_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Default model for flashcard generation
 */
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

/**
 * GET /api/generations
 * Returns paginated list of user's generations
 */
export async function GET({ request, locals }: APIContext) {
  try {
    // Parse query params from URL
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
    };

    // Validate query params
    const validation = generationListQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return badRequest(firstError.message, {
        field: firstError.path[0]?.toString(),
      });
    }

    const query = validation.data;

    // Get user ID from auth context (fallback to placeholder for MVP)
    const userId = locals.user?.id || PLACEHOLDER_USER_ID;

    // Fetch generations from database
    const result = await listGenerations(locals.supabase, userId, query);

    return successResponse(result, 200);

  } catch (error) {
    console.error('Error in GET /api/generations:', error);
    return internalServerError('Database error');
  }
}

/**
 * POST /api/generations
 * Creates new generation from source text using AI
 */
export async function POST({ request, locals }: APIContext) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest('Invalid request body');
    }

    // Validate request body
    const validation = generationCreateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      
      // Check if it's a length validation error for better error message
      if (firstError.code === 'too_small') {
        return unprocessableEntity(firstError.message, {
          field: 'source_text',
          min: 1000,
          actual: (body as GenerationCreateCommand).source_text?.length,
        });
      }
      
      if (firstError.code === 'too_big') {
        return unprocessableEntity(firstError.message, {
          field: 'source_text',
          max: 10000,
          actual: (body as GenerationCreateCommand).source_text?.length,
        });
      }

      return badRequest(firstError.message, {
        field: 'source_text',
      });
    }

    const { source_text } = validation.data;

    // Get user ID from auth context (fallback to placeholder for MVP)
    const userId = locals.user?.id || PLACEHOLDER_USER_ID;

    // Calculate hash of source text
    const sourceTextHash = await calculateSHA256(source_text);
    const sourceTextLength = source_text.length;

    // Check for duplicate hash
    const existingGenerationId = await checkDuplicateHash(
      locals.supabase,
      userId,
      sourceTextHash
    );

    if (existingGenerationId) {
      return conflict('Generation already exists for this source text', {
        existing_generation_id: existingGenerationId,
      });
    }

    // Generate flashcards using LLM
    let flashcards;
    let duration;

    try {
      const result = await generateFlashcards(source_text, DEFAULT_MODEL);
      flashcards = result.flashcards;
      duration = result.duration;
    } catch (error) {
      // Log error to database
      await logGenerationError(
        locals.supabase,
        userId,
        sourceTextHash,
        sourceTextLength,
        DEFAULT_MODEL,
        error instanceof LLMServiceError ? error.code : 'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );

      // Return appropriate error response
      if (error instanceof LLMServiceError) {
        if (error.statusCode === 503 || error.code === 'TIMEOUT') {
          return serviceUnavailable('AI service temporarily unavailable');
        }
        if (error.statusCode === 429) {
          return serviceUnavailable('AI service rate limit exceeded', 60);
        }
      }

      console.error('LLM generation error:', error);
      return internalServerError('Failed to generate flashcards');
    }

    // Save generation to database
    let generation;
    try {
      generation = await createGeneration(locals.supabase, userId, {
        model: DEFAULT_MODEL,
        generated_count: flashcards.length,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        generation_duration: duration,
        accepted_unedited_count: null,
        accepted_edited_count: null,
      });
    } catch (error) {
      console.error('Database error while creating generation:', error);
      return internalServerError('Database error');
    }

    // Remove user_id from response (convert to DTO)
    const { user_id, ...generationDTO } = generation;

    // Prepare response
    const response: GenerationCreateResponse = {
      generation: generationDTO,
      proposed_flashcards: flashcards,
    };

    return successResponse(response, 201);

  } catch (error) {
    console.error('Unexpected error in POST /api/generations:', error);
    return internalServerError('Internal server error');
  }
}

