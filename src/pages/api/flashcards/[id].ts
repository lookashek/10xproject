/**
 * API endpoint for single flashcard
 * GET /api/flashcards/{id} - Get flashcard details
 * PUT /api/flashcards/{id} - Update flashcard
 * DELETE /api/flashcards/{id} - Delete flashcard
 */

import type { APIContext } from "astro";
import type { FlashcardUpdateCommand } from "../../../types";
import { flashcardIdParamSchema, flashcardUpdateSchema } from "../../../lib/validation/flashcard.schemas";
import { getFlashcardById, updateFlashcard, deleteFlashcard } from "../../../lib/services/flashcardService";
import {
  badRequest,
  notFound,
  conflict,
  unprocessableEntity,
  unauthorized,
  internalServerError,
  successResponse,
} from "../../../lib/utils/errors";

export const prerender = false;

/**
 * GET /api/flashcards/{id}
 * Returns single flashcard details
 */
export async function GET({ params, locals }: APIContext) {
  try {
    // Validate ID from URL params
    const validation = flashcardIdParamSchema.safeParse(params.id);

    if (!validation.success) {
      const firstError = validation.error.errors[0];

      // Check if it's a type error (not a number)
      if (firstError.code === "invalid_type") {
        return badRequest("Invalid flashcard ID", {
          field: "id",
        });
      }

      // Check if it's a value error (not positive)
      return badRequest("Flashcard ID must be positive", {
        field: "id",
        min: 1,
      });
    }

    const flashcardId = validation.data;

    // Get user ID from auth context (middleware ensures user is authenticated)
    const userId = locals.user?.id;
    if (!userId) {
      return unauthorized("Wymagane zalogowanie");
    }

    // Fetch flashcard
    const flashcard = await getFlashcardById(locals.supabase, userId, flashcardId);

    if (!flashcard) {
      return notFound("Flashcard not found");
    }

    return successResponse(flashcard, 200);
  } catch (error) {
    console.error("Error in GET /api/flashcards/:id:", error);
    return internalServerError("Database error");
  }
}

/**
 * PUT /api/flashcards/{id}
 * Updates an existing flashcard
 * Automatically changes source from 'ai-full' to 'ai-edited' if content is modified
 */
export async function PUT({ params, request, locals }: APIContext) {
  try {
    // Validate ID from URL params
    const idValidation = flashcardIdParamSchema.safeParse(params.id);

    if (!idValidation.success) {
      const firstError = idValidation.error.errors[0];

      if (firstError.code === "invalid_type") {
        return badRequest("Invalid flashcard ID", {
          field: "id",
        });
      }

      return badRequest("Flashcard ID must be positive", {
        field: "id",
        min: 1,
      });
    }

    const flashcardId = idValidation.data;

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid request body");
    }

    // Validate request body
    const bodyValidation = flashcardUpdateSchema.safeParse(body);
    if (!bodyValidation.success) {
      const firstError = bodyValidation.error.errors[0];

      // Check for length validation errors
      if (firstError.code === "too_big") {
        return unprocessableEntity(firstError.message, {
          field: firstError.path[0]?.toString(),
          max: (firstError as any).maximum,
          actual: (body as FlashcardUpdateCommand)[firstError.path[0] as keyof FlashcardUpdateCommand]?.toString()
            .length,
        });
      }

      return badRequest(firstError.message, {
        field: firstError.path[0]?.toString(),
      });
    }

    const command = bodyValidation.data;

    // Get user ID from auth context (middleware ensures user is authenticated)
    const userId = locals.user?.id;
    if (!userId) {
      return unauthorized("Wymagane zalogowanie");
    }

    // Update flashcard
    try {
      const updated = await updateFlashcard(locals.supabase, userId, flashcardId, command);

      return successResponse(updated, 200);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Flashcard not found") {
          return notFound("Flashcard not found");
        }

        if (error.message.includes("Duplicate")) {
          const match = error.message.match(/ID: (\d+)/);
          const existingId = match ? parseInt(match[1]) : undefined;

          return conflict("Flashcard with this front and back already exists", {
            existing_id: existingId,
          });
        }
      }

      throw error;
    }
  } catch (error) {
    console.error("Unexpected error in PUT /api/flashcards/:id:", error);
    return internalServerError("Internal server error");
  }
}

/**
 * DELETE /api/flashcards/{id}
 * Deletes a flashcard
 */
export async function DELETE({ params, locals }: APIContext) {
  try {
    // Validate ID from URL params
    const validation = flashcardIdParamSchema.safeParse(params.id);

    if (!validation.success) {
      const firstError = validation.error.errors[0];

      if (firstError.code === "invalid_type") {
        return badRequest("Invalid flashcard ID", {
          field: "id",
        });
      }

      return badRequest("Flashcard ID must be positive", {
        field: "id",
        min: 1,
      });
    }

    const flashcardId = validation.data;

    // Get user ID from auth context (middleware ensures user is authenticated)
    const userId = locals.user?.id;
    if (!userId) {
      return unauthorized("Wymagane zalogowanie");
    }

    // Delete flashcard
    try {
      await deleteFlashcard(locals.supabase, userId, flashcardId);

      // Return 204 No Content
      return new Response(null, {
        status: 204,
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "1; mode=block",
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Flashcard not found") {
        return notFound("Flashcard not found");
      }

      throw error;
    }
  } catch (error) {
    console.error("Error in DELETE /api/flashcards/:id:", error);
    return internalServerError("Database error");
  }
}
