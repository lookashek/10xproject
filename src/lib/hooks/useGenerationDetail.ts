/**
 * Hook do zarządzania szczegółami generacji
 *
 * Pobiera i zarządza stanem szczegółów pojedynczej generacji.
 * Obsługuje ładowanie, błędy 404 i refresh danych.
 */

import { useState, useEffect, useCallback } from "react";
import type { GenerationDetailDTO, ErrorState } from "@/types";
import { fetchGenerationById, ApiError } from "@/lib/api/generations";

/**
 * Hook do pobierania szczegółów pojedynczej generacji
 *
 * @param generationId - ID generacji do pobrania
 * @returns Obiekt ze stanem szczegółów generacji
 */
export function useGenerationDetail(generationId: number) {
  const [generation, setGeneration] = useState<GenerationDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorState>(null);

  const loadGeneration = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchGenerationById(generationId);
      setGeneration(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas ładowania szczegółów generacji";
      const errorCode = err instanceof ApiError ? err.code : undefined;
      setError({ message: errorMessage, code: errorCode });
      setGeneration(null);
    } finally {
      setIsLoading(false);
    }
  }, [generationId]);

  useEffect(() => {
    if (generationId > 0) {
      void loadGeneration();
    } else {
      setError({ message: "Nieprawidłowe ID generacji" });
      setIsLoading(false);
    }
  }, [generationId, loadGeneration]);

  return {
    generation,
    isLoading,
    error,
    refetch: loadGeneration,
  };
}
