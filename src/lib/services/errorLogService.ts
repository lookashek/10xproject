/**
 * Error logging service for generation failures
 * Logs failed AI generation attempts to database for debugging and analytics
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { GenerationErrorLogInsert } from "../../types";

/**
 * Logs a generation error to the database
 * Uses ON CONFLICT to update existing error logs for the same source text
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID (UUID) or null for unauthenticated requests
 * @param sourceTextHash - SHA-256 hash of the source text
 * @param sourceTextLength - Length of the source text in characters
 * @param model - AI model used (or attempted to use)
 * @param errorCode - Error code from the AI service
 * @param errorMessage - Human-readable error message
 *
 * @example
 * ```typescript
 * await logGenerationError(
 *   supabase,
 *   '123e4567-e89b-12d3-a456-426614174000',
 *   'a3f7b2c1d4e5f6a7...',
 *   1500,
 *   'anthropic/claude-3.5-sonnet',
 *   'TIMEOUT',
 *   'Request timed out after 60 seconds'
 * );
 * ```
 */
export async function logGenerationError(
  supabase: SupabaseClient<Database>,
  userId: string,
  sourceTextHash: string,
  sourceTextLength: number,
  model: string | null,
  errorCode: string | null,
  errorMessage: string | null
): Promise<void> {
  const errorLog: GenerationErrorLogInsert = {
    user_id: userId,
    source_text_hash: sourceTextHash,
    source_text_length: sourceTextLength,
    model,
    error_code: errorCode,
    error_message: errorMessage,
  };

  // Insert or update on conflict (UNIQUE constraint on user_id, source_text_hash)
  const { error } = await supabase.from("generation_error_logs").upsert(errorLog, {
    onConflict: "user_id,source_text_hash",
  });

  if (error) {
    // Log to console but don't throw - we don't want error logging to break the main flow
    console.error("Failed to log generation error:", error);
  }
}
