/**
 * Zod validation schemas for flashcard endpoints
 * Validates request bodies, query params, and URL params
 */

import { z } from "zod";

/**
 * Enum for flashcard source values
 */
export const flashcardSourceEnum = z.enum(["ai-full", "ai-edited", "manual"]);

/**
 * Schema for GET /api/flashcards query parameters
 * Validates pagination and filtering params
 */
export const flashcardListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  source: flashcardSourceEnum.optional(),
  search: z.string().trim().min(1).max(200).optional(),
});

/**
 * Schema for single flashcard creation
 * Used for both manual creation and AI generation acceptance
 */
export const flashcardCreateSchema = z.object({
  front: z.string().trim().min(1, "Front text is required").max(200, "Front text must not exceed 200 characters"),
  back: z.string().trim().min(1, "Back text is required").max(500, "Back text must not exceed 500 characters"),
  source: flashcardSourceEnum,
  generation_id: z.number().int().positive().nullable().optional(),
});

/**
 * Schema for batch flashcard creation
 * Used when accepting multiple flashcards from AI generation
 */
export const flashcardBatchCreateSchema = z.object({
  flashcards: z
    .array(flashcardCreateSchema)
    .min(1, "At least one flashcard is required")
    .max(50, "Maximum 50 flashcards per batch"),
});

/**
 * Schema for flashcard update
 * At least one field must be provided
 */
export const flashcardUpdateSchema = z
  .object({
    front: z.string().trim().min(1).max(200, "Front text must not exceed 200 characters").optional(),
    back: z.string().trim().min(1).max(500, "Back text must not exceed 500 characters").optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });

/**
 * Schema for validating flashcard ID from URL params
 */
export const flashcardIdParamSchema = z.coerce.number().int().positive();

/**
 * Schema for flashcard form (frontend)
 * Used by FlashcardForm component with React Hook Form
 */
export const flashcardFormSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1, { message: "Przód fiszki jest wymagany" })
    .max(200, { message: "Przód fiszki może mieć maksymalnie 200 znaków" }),
  back: z
    .string()
    .trim()
    .min(1, { message: "Tył fiszki jest wymagany" })
    .max(500, { message: "Tył fiszki może mieć maksymalnie 500 znaków" }),
});
