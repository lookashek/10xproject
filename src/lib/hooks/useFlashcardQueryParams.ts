/**
 * useFlashcardQueryParams - Hook for managing URL query parameters
 */

import { useState, useEffect, useCallback } from "react";
import type { FlashcardSource } from "@/types";

export function useFlashcardQueryParams() {
  // Parse current query params
  const [searchParams, setSearchParams] = useState(() => {
    if (typeof window === "undefined") {
      return new URLSearchParams();
    }
    return new URLSearchParams(window.location.search);
  });

  const page = Number(searchParams.get("page")) || 1;
  const source = (searchParams.get("source") as FlashcardSource) || undefined;

  // Update query params function
  const updateQueryParams = useCallback((newParams: { page?: number; source?: FlashcardSource | "all" }) => {
    const params = new URLSearchParams(window.location.search);

    if (newParams.page !== undefined) {
      params.set("page", String(newParams.page));
    }

    if (newParams.source !== undefined) {
      if (newParams.source === "all") {
        params.delete("source");
      } else {
        params.set("source", newParams.source);
      }
    }

    // Update URL without page reload
    const newUrl = `/flashcards?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
    setSearchParams(new URLSearchParams(params));
  }, []);

  // Listen to popstate events (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return { page, source, updateQueryParams };
}
