/**
 * API endpoint for generations
 * GET /api/generations - List all generations with pagination
 * POST /api/generations - Create new generation from source text
 */

import type { APIContext } from "astro";
import type { GenerationCreateCommand, GenerationCreateResponse } from "../../../types";
import { generationCreateSchema, generationListQuerySchema } from "../../../lib/validation/generation.schemas";
import { calculateSHA256 } from "../../../lib/services/hashService";
import { generateFlashcards, LLMServiceError } from "../../../lib/services/llmService";
import { logGenerationError } from "../../../lib/services/errorLogService";
import { checkDuplicateHash, createGeneration, listGenerations } from "../../../lib/services/generationService";
import {
  badRequest,
  conflict,
  unprocessableEntity,
  unauthorized,
  internalServerError,
  serviceUnavailable,
  successResponse,
} from "../../../lib/utils/errors";

export const prerender = false;

/**
 * Default model for flashcard generation
 */
const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";

/**
 * GET /api/generations
 * Returns paginated list of user's generations
 */
export async function GET({ request, locals }: APIContext) {
  console.log("[GET /api/generations] Request started");
  try {
    // Parse query params from URL
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
    };
    console.log("[GET /api/generations] Query params:", queryParams);

    // Validate query params
    const validation = generationListQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      console.log("[GET /api/generations] Validation failed:", validation.error);
      const firstError = validation.error.errors[0];
      return badRequest(firstError.message, {
        field: firstError.path[0]?.toString(),
      });
    }

    const query = validation.data;
    console.log("[GET /api/generations] Validated query:", query);

    // Get user ID from auth context (middleware ensures user is authenticated)
    const userId = locals.user?.id;
    console.log("[GET /api/generations] User ID:", userId);
    if (!userId) {
      console.log("[GET /api/generations] No user ID - unauthorized");
      return unauthorized("Wymagane zalogowanie");
    }

    // Fetch generations from database
    console.log("[GET /api/generations] Fetching generations from database");
    const result = await listGenerations(locals.supabase, userId, query);
    console.log("[GET /api/generations] Generations fetched successfully, count:", result.generations?.length);

    return successResponse(result, 200);
  } catch (error) {
    // Error in GET /api/generations
    console.error("[GET /api/generations] Error occurred:", error);
    return internalServerError("Database error");
  }
}

/**
 * POST /api/generations
 * Creates new generation from source text using AI
 */
export async function POST({ request, locals }: APIContext) {
  console.log("[POST /api/generations] Request started");
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
      console.log(
        "[POST /api/generations] Body parsed, source_text length:",
        (body as GenerationCreateCommand).source_text?.length
      );
    } catch (error) {
      console.error("[POST /api/generations] Failed to parse body:", error);
      return badRequest("Invalid request body");
    }

    // Validate request body
    const validation = generationCreateSchema.safeParse(body);
    if (!validation.success) {
      console.log("[POST /api/generations] Validation failed:", validation.error);
      const firstError = validation.error.errors[0];

      // Check if it's a length validation error for better error message
      if (firstError.code === "too_small") {
        return unprocessableEntity(firstError.message, {
          field: "source_text",
          min: 1000,
          actual: (body as GenerationCreateCommand).source_text?.length,
        });
      }

      if (firstError.code === "too_big") {
        return unprocessableEntity(firstError.message, {
          field: "source_text",
          max: 10000,
          actual: (body as GenerationCreateCommand).source_text?.length,
        });
      }

      return badRequest(firstError.message, {
        field: "source_text",
      });
    }

    const { source_text } = validation.data;
    console.log("[POST /api/generations] Validation passed");

    // Get user ID from auth context (middleware ensures user is authenticated)
    const userId = locals.user?.id;
    console.log("[POST /api/generations] User ID:", userId);
    if (!userId) {
      console.log("[POST /api/generations] No user ID - unauthorized");
      return unauthorized("Wymagane zalogowanie");
    }

    // Calculate hash of source text
    console.log("[POST /api/generations] Calculating hash");
    const sourceTextHash = await calculateSHA256(source_text);
    const sourceTextLength = source_text.length;
    console.log("[POST /api/generations] Hash calculated:", sourceTextHash);

    // Check for duplicate hash
    console.log("[POST /api/generations] Checking for duplicates");
    const existingGenerationId = await checkDuplicateHash(locals.supabase, userId, sourceTextHash);

    if (existingGenerationId) {
      console.log("[POST /api/generations] Duplicate found:", existingGenerationId);
      return conflict("Generation already exists for this source text", {
        existing_generation_id: existingGenerationId,
      });
    }

    // Generate flashcards using LLM
    console.log("[POST /api/generations] Starting LLM generation with model:", DEFAULT_MODEL);
    let flashcards;
    let duration;

    try {
      const result = await generateFlashcards(source_text, DEFAULT_MODEL);
      flashcards = result.flashcards;
      duration = result.duration;
      console.log(
        "[POST /api/generations] LLM generation successful, flashcards count:",
        flashcards.length,
        "duration:",
        duration
      );
    } catch (error) {
      console.error("[POST /api/generations] LLM generation error:", error);
      console.error("[POST /api/generations] Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "Unknown error",
        code: error instanceof LLMServiceError ? error.code : "N/A",
        statusCode: error instanceof LLMServiceError ? error.statusCode : "N/A",
      });

      // Log error to database
      console.log("[POST /api/generations] Logging error to database");
      await logGenerationError(
        locals.supabase,
        userId,
        sourceTextHash,
        sourceTextLength,
        DEFAULT_MODEL,
        error instanceof LLMServiceError ? error.code : "UNKNOWN_ERROR",
        error instanceof Error ? error.message : "Unknown error occurred"
      );

      // Return appropriate error response
      if (error instanceof LLMServiceError) {
        if (error.statusCode === 503 || error.code === "TIMEOUT") {
          console.log("[POST /api/generations] Returning service unavailable response");
          return serviceUnavailable("AI service temporarily unavailable");
        }
        if (error.statusCode === 429) {
          console.log("[POST /api/generations] Returning rate limit response");
          return serviceUnavailable("AI service rate limit exceeded", 60);
        }
      }

      // LLM generation error
      console.log("[POST /api/generations] Returning internal error response");
      return internalServerError("Failed to generate flashcards");
    }

    // Save generation to database
    console.log("[POST /api/generations] Saving generation to database");
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
      console.log("[POST /api/generations] Generation saved with ID:", generation.id);
    } catch (error) {
      // Database error while creating generation
      console.error("[POST /api/generations] Database error while creating generation:", error);
      return internalServerError("Database error");
    }

    // Remove user_id from response (convert to DTO)
    const { user_id: _, ...generationDTO } = generation;

    // Prepare response
    const response: GenerationCreateResponse = {
      generation: generationDTO,
      proposed_flashcards: flashcards,
    };

    console.log("[POST /api/generations] Request completed successfully");
    return successResponse(response, 201);
  } catch (error) {
    // Unexpected error in POST /api/generations
    console.error("[POST /api/generations] Unexpected error:", error);
    return internalServerError("Internal server error");
  }
}
