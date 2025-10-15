/**
 * Flashcard service for managing flashcard CRUD operations
 * Handles listing, creation, updates, deletion with proper validation and duplicate checking
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  FlashcardDTO,
  FlashcardEntity,
  FlashcardInsert,
  FlashcardCreateCommand,
  FlashcardUpdateCommand,
  FlashcardListQuery,
  FlashcardListResponse,
  FlashcardSource,
} from "../../types";

/**
 * Lists all flashcards for a user with pagination, filtering, and search
 * Ordered by created_at DESC (newest first)
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID (UUID)
 * @param query - Pagination and filtering parameters
 * @returns Paginated list of flashcards with metadata
 *
 * @example
 * ```typescript
 * const result = await listFlashcards(supabase, userId, {
 *   page: 1,
 *   limit: 50,
 *   source: 'manual',
 *   search: 'TypeScript'
 * });
 * ```
 */
export async function listFlashcards(
  supabase: SupabaseClient<Database>,
  userId: string,
  query: FlashcardListQuery
): Promise<FlashcardListResponse> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const offset = (page - 1) * limit;

  // Build base query
  let countQuery = supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", userId);

  let dataQuery = supabase.from("flashcards").select("*").eq("user_id", userId);

  // Apply source filter
  if (query.source) {
    countQuery = countQuery.eq("source", query.source);
    dataQuery = dataQuery.eq("source", query.source);
  }

  // Apply search filter (ILIKE on front OR back)
  if (query.search) {
    const searchPattern = `%${query.search}%`;
    countQuery = countQuery.or(`front.ilike.${searchPattern},back.ilike.${searchPattern}`);
    dataQuery = dataQuery.or(`front.ilike.${searchPattern},back.ilike.${searchPattern}`);
  }

  // Get total count
  const { count, error: countError } = await countQuery;

  if (countError) {
    throw new Error(`Database error while counting flashcards: ${countError.message}`);
  }

  const total = count ?? 0;

  // Get paginated data
  const { data, error } = await dataQuery.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Database error while listing flashcards: ${error.message}`);
  }

  // Map to DTOs (remove user_id)
  const dtos: FlashcardDTO[] = (data ?? []).map(({ user_id, ...rest }) => rest);

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
 * Gets a single flashcard by ID
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID (UUID)
 * @param id - Flashcard ID
 * @returns Flashcard DTO, or null if not found
 *
 * @example
 * ```typescript
 * const flashcard = await getFlashcardById(supabase, userId, 123);
 * if (!flashcard) {
 *   throw new Error('Flashcard not found');
 * }
 * ```
 */
export async function getFlashcardById(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: number
): Promise<FlashcardDTO | null> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Database error while fetching flashcard: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // Map to DTO (remove user_id)
  const { user_id, ...flashcardDTO } = data;
  return flashcardDTO;
}

/**
 * Checks if a duplicate flashcard exists (same front and back)
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID (UUID)
 * @param front - Front text of flashcard
 * @param back - Back text of flashcard
 * @param excludeId - Optional ID to exclude from check (for updates)
 * @returns Existing flashcard ID if duplicate found, null otherwise
 *
 * @example
 * ```typescript
 * const duplicateId = await checkDuplicate(supabase, userId, front, back);
 * if (duplicateId) {
 *   throw new Error(`Duplicate flashcard exists with ID: ${duplicateId}`);
 * }
 * ```
 */
export async function checkDuplicate(
  supabase: SupabaseClient<Database>,
  userId: string,
  front: string,
  back: string,
  excludeId?: number
): Promise<number | null> {
  let query = supabase.from("flashcards").select("id").eq("user_id", userId).eq("front", front).eq("back", back);

  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Database error while checking duplicate: ${error.message}`);
  }

  return data?.id ?? null;
}

/**
 * Creates a single flashcard
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID (UUID)
 * @param command - Flashcard creation data
 * @returns Created flashcard DTO
 *
 * @example
 * ```typescript
 * const flashcard = await createFlashcard(supabase, userId, {
 *   front: 'What is React?',
 *   back: 'A JavaScript library',
 *   source: 'manual'
 * });
 * ```
 */
export async function createFlashcard(
  supabase: SupabaseClient<Database>,
  userId: string,
  command: FlashcardCreateCommand
): Promise<FlashcardDTO> {
  // Check for duplicate
  const duplicateId = await checkDuplicate(supabase, userId, command.front, command.back);
  if (duplicateId) {
    throw new Error(`Duplicate flashcard exists with ID: ${duplicateId}`);
  }

  // Prepare insert data
  const insertData: FlashcardInsert = {
    user_id: userId,
    front: command.front,
    back: command.back,
    source: command.source,
    generation_id: command.generation_id ?? null,
  };

  const { data, error } = await supabase.from("flashcards").insert(insertData).select().single();

  if (error) {
    throw new Error(`Database error while creating flashcard: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to create flashcard: No data returned");
  }

  // Map to DTO (remove user_id)
  const { user_id, ...flashcardDTO } = data;
  return flashcardDTO;
}

/**
 * Creates multiple flashcards in a batch
 * If generation_id is provided, also updates generation statistics
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID (UUID)
 * @param commands - Array of flashcard creation commands
 * @param generationId - Optional generation ID to link flashcards to
 * @returns Array of created flashcard DTOs
 *
 * @example
 * ```typescript
 * const flashcards = await createFlashcardsBatch(supabase, userId, [
 *   { front: 'Q1', back: 'A1', source: 'ai-full' },
 *   { front: 'Q2', back: 'A2', source: 'ai-edited' }
 * ], 45);
 * ```
 */
export async function createFlashcardsBatch(
  supabase: SupabaseClient<Database>,
  userId: string,
  commands: FlashcardCreateCommand[],
  generationId?: number
): Promise<FlashcardDTO[]> {
  // Check for duplicates
  for (const command of commands) {
    const duplicateId = await checkDuplicate(supabase, userId, command.front, command.back);
    if (duplicateId) {
      throw new Error(`Duplicate flashcard exists with ID: ${duplicateId} for front: "${command.front}"`);
    }
  }

  // Prepare insert data
  const insertData: FlashcardInsert[] = commands.map((command) => ({
    user_id: userId,
    front: command.front,
    back: command.back,
    source: command.source,
    generation_id: generationId ?? command.generation_id ?? null,
  }));

  // Insert flashcards
  const { data, error } = await supabase.from("flashcards").insert(insertData).select();

  if (error) {
    throw new Error(`Database error while creating flashcards: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("Failed to create flashcards: No data returned");
  }

  // If generation_id is provided, update generation statistics
  if (generationId) {
    const uneditedCount = commands.filter((c) => c.source === "ai-full").length;
    const editedCount = commands.filter((c) => c.source === "ai-edited").length;

    const { error: updateError } = await supabase
      .from("generations")
      .update({
        accepted_unedited_count: uneditedCount,
        accepted_edited_count: editedCount,
      })
      .eq("id", generationId)
      .eq("user_id", userId);

    if (updateError) {
      // Log error but don't fail the operation since flashcards were created
      console.error(`Warning: Failed to update generation statistics for generation ${generationId}:`, updateError);
    }
  }

  // Map to DTOs (remove user_id)
  const dtos: FlashcardDTO[] = data.map(({ user_id, ...rest }) => rest);
  return dtos;
}

/**
 * Updates an existing flashcard
 * Automatically changes source from 'ai-full' to 'ai-edited' if content is modified
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID (UUID)
 * @param id - Flashcard ID
 * @param command - Update data (front and/or back)
 * @returns Updated flashcard DTO
 *
 * @example
 * ```typescript
 * const updated = await updateFlashcard(supabase, userId, 123, {
 *   front: 'Updated question?',
 *   back: 'Updated answer'
 * });
 * ```
 */
export async function updateFlashcard(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: number,
  command: FlashcardUpdateCommand
): Promise<FlashcardDTO> {
  // Get existing flashcard
  const existing = await getFlashcardById(supabase, userId, id);
  if (!existing) {
    throw new Error("Flashcard not found");
  }

  // Prepare new values
  const newFront = command.front ?? existing.front;
  const newBack = command.back ?? existing.back;

  // Check for duplicate (excluding current flashcard)
  const duplicateId = await checkDuplicate(supabase, userId, newFront, newBack, id);
  if (duplicateId) {
    throw new Error(`Duplicate flashcard exists with ID: ${duplicateId}`);
  }

  // Determine if source should change to 'ai-edited'
  const contentChanged = command.front !== undefined || command.back !== undefined;
  const shouldChangeToEdited = existing.source === "ai-full" && contentChanged;

  // Prepare update data
  const updateData: Partial<FlashcardEntity> = {
    ...(command.front !== undefined && { front: command.front }),
    ...(command.back !== undefined && { back: command.back }),
    ...(shouldChangeToEdited && { source: "ai-edited" as FlashcardSource }),
  };

  const { data, error } = await supabase
    .from("flashcards")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Database error while updating flashcard: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to update flashcard: No data returned");
  }

  // Map to DTO (remove user_id)
  const { user_id, ...flashcardDTO } = data;
  return flashcardDTO;
}

/**
 * Deletes a flashcard
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID (UUID)
 * @param id - Flashcard ID
 * @returns void
 *
 * @example
 * ```typescript
 * await deleteFlashcard(supabase, userId, 123);
 * ```
 */
export async function deleteFlashcard(supabase: SupabaseClient<Database>, userId: string, id: number): Promise<void> {
  // Check if flashcard exists
  const existing = await getFlashcardById(supabase, userId, id);
  if (!existing) {
    throw new Error("Flashcard not found");
  }

  const { error } = await supabase.from("flashcards").delete().eq("id", id).eq("user_id", userId);

  if (error) {
    throw new Error(`Database error while deleting flashcard: ${error.message}`);
  }
}
