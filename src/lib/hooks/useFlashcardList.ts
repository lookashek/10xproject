/**
 * useFlashcardList - Custom hook for managing flashcard list state and CRUD operations
 */

import { useState, useCallback } from "react";
import type {
  FlashcardDTO,
  FlashcardListResponse,
  FlashcardSource,
  FlashcardCreateCommand,
  FlashcardUpdateCommand,
  PaginationMeta,
  ApiError,
} from "@/types";

export function useFlashcardList(initialData: FlashcardListResponse, page: number, source?: FlashcardSource) {
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>(initialData.data);
  const [pagination, setPagination] = useState<PaginationMeta>(initialData.pagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);

  // Fetch flashcards
  const fetchFlashcards = useCallback(async (page: number, source?: FlashcardSource) => {
    setIsLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "50",
      });

      if (source && source !== "all") {
        query.append("source", source);
      }

      const response = await fetch(`/api/flashcards?${query.toString()}`);

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error.message);
      }

      const data: FlashcardListResponse = await response.json();
      setFlashcards(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Nie udało się pobrać fiszek",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create flashcard
  const createFlashcard = useCallback(
    async (data: { front: string; back: string }): Promise<void> => {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: data.front,
          back: data.back,
          source: "manual",
        } as FlashcardCreateCommand),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error.message);
      }

      // Refresh list after creation
      await fetchFlashcards(page, source);
    },
    [fetchFlashcards, page, source]
  );

  // Update flashcard
  const updateFlashcard = useCallback(async (id: number, data: { front: string; back: string }): Promise<void> => {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data as FlashcardUpdateCommand),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error.message);
    }

    // Update local state optimistically
    const updatedFlashcard: FlashcardDTO = await response.json();
    setFlashcards((prev) => prev.map((fc) => (fc.id === id ? updatedFlashcard : fc)));
  }, []);

  // Delete flashcard
  const deleteFlashcard = useCallback(async (id: number): Promise<void> => {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error.message);
    }

    // Remove from local state
    setFlashcards((prev) => prev.filter((fc) => fc.id !== id));

    // Update pagination count
    setPagination((prev) => ({
      ...prev,
      total: prev.total - 1,
      total_pages: Math.ceil((prev.total - 1) / prev.limit),
    }));
  }, []);

  return {
    flashcards,
    pagination,
    isLoading,
    error,
    fetchFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
  };
}
