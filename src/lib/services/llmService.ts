/**
 * LLM service for AI-powered flashcard generation
 * Integrates with OpenRouter.ai API via OpenRouterService to generate flashcards
 */

import type { ProposedFlashcard } from "../../types";
import { proposedFlashcardsArraySchema } from "../validation/generation.schemas";
import { zodToJsonSchema } from "zod-to-json-schema";
import { OpenRouterService, OpenRouterError } from "../openrouter.service";

/**
 * OpenRouter.ai API configuration
 */
const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";
const REQUEST_TIMEOUT = 60000; // 60 seconds

/**
 * System prompt for flashcard generation
 * Instructs the AI to generate high-quality flashcards from source text
 */
const SYSTEM_PROMPT = `You are an expert at creating educational flashcards. Your task is to analyze the provided source text and generate high-quality flashcards that help users learn and retain the key information.

Guidelines for creating flashcards:
1. Extract the most important concepts, facts, and relationships from the text
2. Create clear, concise questions (front) and accurate answers (back)
3. Each flashcard should focus on a single concept or fact
4. Questions should be specific and unambiguous
5. Answers should be comprehensive but concise
6. Use simple, clear language
7. Avoid redundancy between flashcards
8. Aim for 5-15 flashcards depending on the source text complexity

Return your response as a JSON array of flashcards with the following structure:
[
  {
    "front": "Question or prompt",
    "back": "Answer or explanation"
  }
]

Important constraints:
- "front" must be 1-200 characters
- "back" must be 1-500 characters
- Return ONLY the JSON array, no additional text or markdown formatting`;

/**
 * User prompt template for flashcard generation
 */
const createUserPrompt = (sourceText: string): string => {
  return `Please analyze the following text and generate flashcards:\n\n${sourceText}`;
};

/**
 * Custom error class for LLM service errors
 */
export class LLMServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "LLMServiceError";
  }
}

/**
 * Converts OpenRouterError to LLMServiceError
 */
function convertError(error: OpenRouterError): LLMServiceError {
  return new LLMServiceError(error.message, error.code, error.statusCode);
}

/**
 * Generates flashcards from source text using OpenRouter.ai API
 *
 * @param sourceText - Source text to analyze (1000-10000 characters)
 * @param model - AI model to use (default: anthropic/claude-3.5-sonnet)
 * @returns Object containing proposed flashcards and generation duration in milliseconds
 * @throws {LLMServiceError} When API call fails or times out
 *
 * @example
 * ```typescript
 * const result = await generateFlashcards(
 *   "TypeScript is a strongly typed programming language...",
 *   "anthropic/claude-3.5-sonnet"
 * );
 * console.log(result.flashcards); // Array of ProposedFlashcard
 * console.log(result.duration);   // 3200 (ms)
 * ```
 */
export async function generateFlashcards(
  sourceText: string,
  model: string = DEFAULT_MODEL
): Promise<{
  flashcards: ProposedFlashcard[];
  duration: number;
}> {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new LLMServiceError("OpenRouter API key not configured", "CONFIG_ERROR", 500);
  }

  const startTime = Date.now();

  // Initialize OpenRouter service
  const service = new OpenRouterService({
    apiKey,
    defaultModel: model,
    requestTimeout: REQUEST_TIMEOUT,
  });

  // Prepare JSON Schema for response_format
  const jsonSchema = zodToJsonSchema(proposedFlashcardsArraySchema, {
    name: "flashcards_array",
    $refStrategy: "none",
  });

  try {
    const response = await service.generateCompletion({
      systemMessage: SYSTEM_PROMPT,
      userMessage: createUserPrompt(sourceText),
      model,
      modelParams: {
        temperature: 0.7,
        maxTokens: 2000,
      },
      responseSchema: {
        name: "flashcards_array",
        schema: proposedFlashcardsArraySchema,
        jsonSchema,
      },
    });

    const duration = Date.now() - startTime;

    const flashcards: ProposedFlashcard[] = (response.data as { front: string; back: string }[]).map((fc) => ({
      front: fc.front,
      back: fc.back,
      source: "ai-full" as const,
    }));

    if (flashcards.length === 0) {
      throw new LLMServiceError("No flashcards generated", "VALIDATION_ERROR", 500);
    }

    return { flashcards, duration };
  } catch (error) {
    if (error instanceof OpenRouterError) {
      throw convertError(error);
    }
    if (error instanceof LLMServiceError) {
      throw error;
    }
    throw new LLMServiceError("Unexpected error during flashcard generation", "INTERNAL_ERROR", 500);
  }
}

/**
 * Parses flashcards from LLM response content
 * Extracts JSON array from response and validates each flashcard
 *
 * @param content - Raw content from LLM response
 * @returns Array of validated proposed flashcards
 * @throws {LLMServiceError} When parsing fails or validation fails
 *
 * @example
 * ```typescript
 * const content = '[{"front":"Q1","back":"A1"},{"front":"Q2","back":"A2"}]';
 * const flashcards = parseFlashcardsFromResponse(content);
 * ```
 */
export function parseFlashcardsFromResponse(content: string): ProposedFlashcard[] {
  try {
    // Try to extract JSON from content (in case LLM adds extra text)
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate with Zod schema
    const validationResult = proposedFlashcardsArraySchema.safeParse(parsed);

    if (!validationResult.success) {
      console.error("Flashcard validation errors:", validationResult.error.errors);
      throw new Error("Generated flashcards failed validation");
    }

    // Add source field to each flashcard
    const flashcards: ProposedFlashcard[] = validationResult.data.map((fc) => ({
      ...fc,
      source: "ai-full" as const,
    }));

    if (flashcards.length === 0) {
      throw new Error("No flashcards generated");
    }

    return flashcards;
  } catch (error) {
    throw new LLMServiceError("Failed to parse flashcards from AI response", "PARSE_ERROR", 500);
  }
}
