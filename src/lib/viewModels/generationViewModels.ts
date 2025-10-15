/**
 * ViewModels i funkcje pomocnicze dla widoku generacji
 *
 * Zawiera funkcje do przetwarzania i formatowania danych z API
 * dla komponentów widoku historii generacji.
 */

import type { GenerationDTO, AcceptanceRateViewModel } from "@/types";

/**
 * Oblicza wskaźnik akceptacji fiszek i zwraca ViewModel
 */
export function calculateAcceptanceRate(generation: GenerationDTO): AcceptanceRateViewModel {
  const acceptedUnedited = generation.accepted_unedited_count ?? 0;
  const acceptedEdited = generation.accepted_edited_count ?? 0;
  const totalAccepted = acceptedUnedited + acceptedEdited;
  const percentage =
    generation.generated_count > 0 ? Math.round((totalAccepted / generation.generated_count) * 100) : 0;

  let variant: "low" | "medium" | "high";
  if (percentage < 50) {
    variant = "low";
  } else if (percentage < 75) {
    variant = "medium";
  } else {
    variant = "high";
  }

  return {
    percentage,
    acceptedUnedited,
    acceptedEdited,
    totalAccepted,
    variant,
  };
}

/**
 * Formatuje długość tekstu (dodaje jednostkę)
 */
export function formatTextLength(length: number): string {
  return `${length.toLocaleString("pl-PL")} znaków`;
}

/**
 * Formatuje czas generowania (ms → s jeśli > 1000)
 */
export function formatGenerationDuration(durationMs: number): string {
  if (durationMs >= 1000) {
    const seconds = (durationMs / 1000).toFixed(2);
    return `${seconds} s`;
  }
  return `${durationMs} ms`;
}

/**
 * Formatuje liczbę zaakceptowanych fiszek
 */
export function formatAcceptedCounts(unedited: number | null, edited: number | null): string {
  const uneditedCount = unedited ?? 0;
  const editedCount = edited ?? 0;
  return `${uneditedCount} bez edycji / ${editedCount} z edycją`;
}
