/**
 * API client dla endpointów generations
 * 
 * Zawiera funkcje do komunikacji z backendem dla generowania fiszek przez AI
 * oraz zapisywania zaakceptowanych fiszek.
 */

import type {
  GenerationCreateCommand,
  GenerationCreateResponse,
  FlashcardBatchCreateCommand,
  FlashcardCreateCommand,
} from '../../types';
import type { GenerationData } from '../viewModels/generateView.types';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generuje fiszki z tekstu źródłowego
 * 
 * @param sourceText - Tekst źródłowy do analizy przez AI (1000-10000 znaków)
 * @returns Dane generacji wraz z propozycjami fiszek
 * @throws ApiError - Błędy API lub sieciowe
 */
export async function generateFlashcardsFromText(
  sourceText: string
): Promise<GenerationData> {
  try {
    const response = await fetch('/api/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_text: sourceText,
      } as GenerationCreateCommand),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(
        response.status,
        errorData.error.code,
        errorData.error.message,
        errorData.error.details
      );
    }

    const data: GenerationCreateResponse = await response.json();

    return {
      generation: data.generation,
      proposals: data.proposed_flashcards,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network error
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Sprawdź połączenie internetowe i spróbuj ponownie'
    );
  }
}

/**
 * Zapisuje zaakceptowane fiszki
 * 
 * @param flashcards - Lista fiszek do zapisania
 * @throws ApiError - Błędy API lub sieciowe
 */
export async function saveAcceptedFlashcards(
  flashcards: FlashcardCreateCommand[]
): Promise<void> {
  try {
    const response = await fetch('/api/flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flashcards,
      } as FlashcardBatchCreateCommand),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(
        response.status,
        errorData.error.code,
        errorData.error.message,
        errorData.error.details
      );
    }

    // Success - brak zwracanej wartości potrzebnej
    return;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network error
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Sprawdź połączenie internetowe i spróbuj ponownie'
    );
  }
}

