/**
 * Hook do zarządzania listą generacji
 *
 * Pobiera i zarządza stanem listy generacji z paginacją.
 * Obsługuje ładowanie, błędy i refresh danych.
 */

import { useState, useEffect } from "react";
import type { GenerationDTO, PaginationMeta, ErrorState } from "@/types";
import { fetchGenerations } from "@/lib/api/generations";

/**
 * Hook do pobierania i zarządzania listą generacji
 *
 * @param initialPage - Początkowa strona paginacji (domyślnie 1)
 * @returns Obiekt ze stanem listy generacji
 */
export function useGenerationsList(initialPage = 1) {
  const [generations, setGenerations] = useState<GenerationDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorState>(null);

  const loadGenerations = async (page: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchGenerations({ page, limit: 20 });
      setGenerations(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas ładowania generacji";
      setError({ message: errorMessage });
      setGenerations([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGenerations(initialPage);
  }, [initialPage]);

  return {
    generations,
    pagination,
    isLoading,
    error,
    refetch: loadGenerations,
  };
}
