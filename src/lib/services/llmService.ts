/**
 * LLM service for AI-powered flashcard generation
 * Integrates with OpenRouter.ai API to generate flashcards from source text
 */

import type { ProposedFlashcard } from '../../types';
import { proposedFlashcardsArraySchema } from '../validation/generation.schemas';

/**
 * OpenRouter.ai API configuration
 */
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';
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
    this.name = 'LLMServiceError';
  }
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
  // ============================================================================
  // MOCKED IMPLEMENTATION - FOR TESTING PURPOSES
  // TODO: Replace with real OpenRouter.ai API integration
  // ============================================================================
  
  const startTime = Date.now();
  
  // Simulate API call delay (1-3 seconds)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const duration = Date.now() - startTime;

  // Generate mock flashcards based on source text length
  const wordCount = sourceText.split(/\s+/).length;
  const flashcardCount = Math.min(Math.max(Math.floor(wordCount / 50), 3), 10);

  const mockFlashcards: ProposedFlashcard[] = Array.from({ length: flashcardCount }, (_, i) => ({
    front: `Question ${i + 1}: What is a key concept from the source text?`,
    back: `Answer ${i + 1}: This is a generated explanation based on the provided source material. The concept relates to important information extracted from the text.`,
    source: 'ai-full' as const,
  }));

  return {
    flashcards: mockFlashcards,
    duration,
  };

  /* ============================================================================
   * REAL IMPLEMENTATION - UNCOMMENT WHEN READY TO USE OPENROUTER.AI
   * ============================================================================
   
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new LLMServiceError(
      'OpenRouter API key not configured',
      'CONFIG_ERROR',
      500
    );
  }

  const startTime = Date.now();

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://10xproject.app', // Required by OpenRouter
        'X-Title': '10x Flashcards', // Optional, for OpenRouter analytics
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: createUserPrompt(sourceText),
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Calculate duration
    const duration = Date.now() - startTime;

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        throw new LLMServiceError(
          'Rate limit exceeded on AI service',
          'RATE_LIMIT',
          429
        );
      }

      if (response.status >= 500) {
        throw new LLMServiceError(
          'AI service temporarily unavailable',
          'SERVICE_UNAVAILABLE',
          503
        );
      }

      throw new LLMServiceError(
        errorData.error?.message || 'AI service request failed',
        'API_ERROR',
        response.status
      );
    }

    // Parse response
    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new LLMServiceError(
        'Invalid response from AI service',
        'INVALID_RESPONSE',
        500
      );
    }

    // Extract and parse flashcards from response
    const flashcards = parseFlashcardsFromResponse(data.choices[0].message.content);

    return {
      flashcards,
      duration,
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new LLMServiceError(
        'AI service request timed out',
        'TIMEOUT',
        503
      );
    }

    // Re-throw LLMServiceError
    if (error instanceof LLMServiceError) {
      throw error;
    }

    // Handle network errors
    throw new LLMServiceError(
      'Failed to connect to AI service',
      'NETWORK_ERROR',
      503
    );
  }
  
  ============================================================================ */
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
      throw new Error('No JSON array found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate with Zod schema
    const validationResult = proposedFlashcardsArraySchema.safeParse(parsed);

    if (!validationResult.success) {
      console.error('Flashcard validation errors:', validationResult.error.errors);
      throw new Error('Generated flashcards failed validation');
    }

    // Add source field to each flashcard
    const flashcards: ProposedFlashcard[] = validationResult.data.map(fc => ({
      ...fc,
      source: 'ai-full' as const,
    }));

    if (flashcards.length === 0) {
      throw new Error('No flashcards generated');
    }

    return flashcards;

  } catch (error) {
    throw new LLMServiceError(
      'Failed to parse flashcards from AI response',
      'PARSE_ERROR',
      500
    );
  }
}

