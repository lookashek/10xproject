/**
 * API endpoint for flashcards
 * GET /api/flashcards - List all flashcards with pagination and filtering
 * POST /api/flashcards - Create single flashcard or batch of flashcards
 */

import type { APIContext } from "astro";
import type { FlashcardCreateCommand } from "../../../types";
import {
  flashcardListQuerySchema,
  flashcardCreateSchema,
  flashcardBatchCreateSchema,
} from "../../../lib/validation/flashcard.schemas";
import { listFlashcards, createFlashcard, createFlashcardsBatch } from "../../../lib/services/flashcardService";
import {
  badRequest,
  conflict,
  unprocessableEntity,
  unauthorized,
  internalServerError,
  successResponse,
} from "../../../lib/utils/errors";

export const prerender = false;

/**
 * GET /api/flashcards
 * Returns paginated list of user's flashcards with optional filtering and search
 */
export async function GET({ request, locals }: APIContext) {
  try {
    // Parse query params from URL
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      source: url.searchParams.get("source") || undefined,
      search: url.searchParams.get("search") || undefined,
    };

    // Validate query params
    const validation = flashcardListQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return badRequest(firstError.message, {
        field: firstError.path[0]?.toString(),
      });
    }

    const query = validation.data;

    // Get user ID from auth context (middleware ensures user is authenticated)
    const userId = locals.user?.id;
    if (!userId) {
      return unauthorized("Wymagane zalogowanie");
    }

    // Fetch flashcards from database
    const result = await listFlashcards(locals.supabase, userId, query);

    return successResponse(result, 200);
  } catch {
    // Error in GET /api/flashcards
    return internalServerError("Database error");
  }
}

/**
 * POST /api/flashcards
 * Creates single flashcard or batch of flashcards
 * Detects batch mode by checking for 'flashcards' array property
 */
export async function POST({ request, locals }: APIContext) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid request body");
    }

    // Get user ID from auth context (middleware ensures user is authenticated)
    const userId = locals.user?.id;
    if (!userId) {
      return unauthorized("Wymagane zalogowanie");
    }

    // Detect if this is a batch or single create
    const isBatch = typeof body === "object" && body !== null && "flashcards" in body;

    if (isBatch) {
      // Validate batch request
      const validation = flashcardBatchCreateSchema.safeParse(body);
      if (!validation.success) {
        const firstError = validation.error.errors[0];

        // Check for length validation errors
        if (firstError.code === "too_small" || firstError.code === "too_big") {
          return unprocessableEntity(firstError.message, {
            field: firstError.path.join("."),
          });
        }

        return badRequest(firstError.message, {
          field: firstError.path.join("."),
        });
      }

      const { flashcards } = validation.data;

      // Extract generation_id if all flashcards have the same one
      const generationIds = new Set(
        flashcards.map((f) => f.generation_id).filter((id): id is number => typeof id === "number")
      );
      const generationId = generationIds.size === 1 ? Array.from(generationIds)[0] : undefined;

      // Create flashcards in batch
      try {
        const created = await createFlashcardsBatch(locals.supabase, userId, flashcards, generationId);

        return successResponse({ data: created }, 201);
      } catch (error) {
        if (error instanceof Error && error.message.includes("Duplicate")) {
          const match = error.message.match(/ID: (\d+)/);
          const existingId = match ? parseInt(match[1]) : undefined;

          return conflict("Flashcard with this front and back already exists", {
            existing_id: existingId,
          });
        }
        throw error;
      }
    } else {
      // Validate single flashcard request
      const validation = flashcardCreateSchema.safeParse(body);
      if (!validation.success) {
        const firstError = validation.error.errors[0];

        // Check for length validation errors
        if (firstError.code === "too_big") {
          type TooBigError = typeof firstError & { maximum?: number };
          const max = (firstError as TooBigError).maximum;
          return unprocessableEntity(firstError.message, {
            field: firstError.path[0]?.toString(),
            max,
            actual: (body as FlashcardCreateCommand)[firstError.path[0] as keyof FlashcardCreateCommand]?.toString()
              .length,
          });
        }

        return badRequest(firstError.message, {
          field: firstError.path[0]?.toString(),
        });
      }

      const command = validation.data;

      // Create single flashcard
      try {
        const created = await createFlashcard(locals.supabase, userId, command);

        return successResponse({ data: [created] }, 201);
      } catch (error) {
        if (error instanceof Error && error.message.includes("Duplicate")) {
          const match = error.message.match(/ID: (\d+)/);
          const existingId = match ? parseInt(match[1]) : undefined;

          return conflict("Flashcard with this front and back already exists", {
            existing_id: existingId,
          });
        }
        throw error;
      }
    }
  } catch {
    // Unexpected error in POST /api/flashcards
    return internalServerError("Internal server error");
  }
}
