/**
 * API client dla endpointów flashcards
 * 
 * Zawiera funkcje do komunikacji z backendem dla operacji CRUD na fiszkach.
 */

import type {
  FlashcardListQuery,
  FlashcardListResponse,
  ApiError as ApiErrorType,
} from '@/types';

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
 * Pobierz listę fiszek z filtrami i paginacją
 * 
 * @param query - Parametry zapytania (page, limit, source, search)
 * @returns Lista fiszek z metadanymi paginacji
 * @throws ApiError - Błędy API lub sieciowe
 */
export async function fetchFlashcards(
  query: FlashcardListQuery = {}
): Promise<FlashcardListResponse> {
  try {
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', String(query.page));
    if (query.limit) params.append('limit', String(query.limit));
    if (query.source) params.append('source', query.source);
    if (query.search) params.append('search', query.search);

    const response = await fetch(`/api/flashcards?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: ApiErrorType = await response.json();
      throw new ApiError(
        response.status,
        errorData.error.code,
        errorData.error.message,
        errorData.error.details
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      500,
      'INTERNAL_SERVER_ERROR',
      error instanceof Error ? error.message : 'Nie udało się pobrać fiszek'
    );
  }
}

