/**
 * Zod validation schemas for generation endpoints
 * Validates request bodies, query params, and LLM responses
 */

import { z } from 'zod';

/**
 * Schema for POST /api/generations request body
 * Validates source text length (1000-10000 characters)
 */
export const generationCreateSchema = z.object({
  source_text: z
    .string()
    .trim()
    .min(1000, 'Source text must be at least 1000 characters')
    .max(10000, 'Source text must not exceed 10000 characters'),
});

/**
 * Schema for GET /api/generations query parameters
 * Validates pagination params
 */
export const generationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * Schema for validating generation ID from URL params
 */
export const generationIdSchema = z.coerce.number().int().positive();

/**
 * Schema for validating single proposed flashcard from LLM
 * Used to validate each flashcard in the AI response
 */
export const proposedFlashcardSchema = z.object({
  front: z.string().trim().min(1).max(200),
  back: z.string().trim().min(1).max(500),
});

/**
 * Schema for validating array of proposed flashcards from LLM
 */
export const proposedFlashcardsArraySchema = z.array(proposedFlashcardSchema).min(1);

