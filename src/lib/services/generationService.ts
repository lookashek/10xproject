/**
 * Generation service for managing AI flashcard generations
 * Handles CRUD operations for generations with pagination and statistics
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type {
  GenerationEntity,
  GenerationInsert,
  GenerationDTO,
  GenerationListQuery,
  GenerationListResponse,
  GenerationDetailDTO,
} from '../../types';

/**
 * Checks if a generation with the same source text hash already exists for the user
 * Used to prevent duplicate generations from the same source text
 * 
 * @param supabase - Supabase client instance
 * @param userId - User ID (UUID)
 * @param hash - SHA-256 hash of source text
 * @returns Generation ID if duplicate exists, null otherwise
 * 
 * @example
 * ```typescript
 * const existingId = await checkDuplicateHash(supabase, userId, hash);
 * if (existingId) {
 *   throw new Error(`Generation already exists with ID: ${existingId}`);
 * }
 * ```
 */
export async function checkDuplicateHash(
  supabase: SupabaseClient<Database>,
  userId: string,
  hash: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from('generations')
    .select('id')
    .eq('user_id', userId)
    .eq('source_text_hash', hash)
    .maybeSingle();

  if (error) {
    throw new Error(`Database error while checking duplicate: ${error.message}`);
  }

  return data?.id ?? null;
}

/**
 * Creates a new generation record in the database
 * 
 * @param supabase - Supabase client instance
 * @param userId - User ID (UUID)
 * @param data - Generation data without user_id
 * @returns Created generation entity
 * 
 * @example
 * ```typescript
 * const generation = await createGeneration(supabase, userId, {
 *   model: 'anthropic/claude-3.5-sonnet',
 *   generated_count: 5,
 *   source_text_hash: 'a3f7b2c...',
 *   source_text_length: 1500,
 *   generation_duration: 3200,
 * });
 * ```
 */
export async function createGeneration(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: Omit<GenerationInsert, 'user_id'>
): Promise<GenerationEntity> {
  const insertData: GenerationInsert = {
    ...data,
    user_id: userId,
  };

  const { data: generation, error } = await supabase
    .from('generations')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Database error while creating generation: ${error.message}`);
  }

  if (!generation) {
    throw new Error('Failed to create generation: No data returned');
  }

  return generation;
}

/**
 * Lists all generations for a user with pagination
 * Ordered by created_at DESC (newest first)
 * 
 * @param supabase - Supabase client instance
 * @param userId - User ID (UUID)
 * @param query - Pagination parameters (page, limit)
 * @returns Paginated list of generations with metadata
 * 
 * @example
 * ```typescript
 * const result = await listGenerations(supabase, userId, {
 *   page: 1,
 *   limit: 20
 * });
 * console.log(result.data);       // Array of GenerationDTO
 * console.log(result.pagination); // { page, limit, total, total_pages }
 * ```
 */
export async function listGenerations(
  supabase: SupabaseClient<Database>,
  userId: string,
  query: GenerationListQuery
): Promise<GenerationListResponse> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  // Get total count
  const { count, error: countError } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    throw new Error(`Database error while counting generations: ${countError.message}`);
  }

  const total = count ?? 0;

  // Get paginated data
  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Database error while listing generations: ${error.message}`);
  }

  // Map to DTOs (remove user_id)
  const dtos: GenerationDTO[] = (data ?? []).map(({ user_id, ...rest }) => rest);

  return {
    data: dtos,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Gets a single generation by ID with associated flashcards
 * Uses LEFT JOIN to include flashcards that were accepted from this generation
 * 
 * @param supabase - Supabase client instance
 * @param userId - User ID (UUID)
 * @param id - Generation ID
 * @returns Generation details with flashcards, or null if not found
 * 
 * @example
 * ```typescript
 * const detail = await getGenerationById(supabase, userId, 46);
 * if (!detail) {
 *   return notFound('Generation not found');
 * }
 * console.log(detail.flashcards); // Array of accepted flashcards
 * ```
 */
export async function getGenerationById(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: number
): Promise<GenerationDetailDTO | null> {
  // Get generation
  const { data: generation, error: genError } = await supabase
    .from('generations')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (genError) {
    throw new Error(`Database error while fetching generation: ${genError.message}`);
  }

  if (!generation) {
    return null;
  }

  // Get associated flashcards
  const { data: flashcards, error: fcError } = await supabase
    .from('flashcards')
    .select('id, front, back, source')
    .eq('generation_id', id)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (fcError) {
    throw new Error(`Database error while fetching flashcards: ${fcError.message}`);
  }

  // Map to DTO (remove user_id from generation)
  const { user_id, ...generationWithoutUserId } = generation;

  return {
    ...generationWithoutUserId,
    flashcards: flashcards ?? [],
  };
}

