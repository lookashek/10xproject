/**
 * Typy ViewModel dla widoku Generowania Fiszek
 *
 * Ten plik zawiera typy specyficzne dla widoku /generate,
 * które nie są częścią ogólnych typów API.
 */

import type { ProposedFlashcard, GenerationDTO, FlashcardCreateCommand } from "../../types";

/**
 * Stan głównego widoku GenerateView
 */
export interface GenerateViewState {
  /** Faza widoku */
  phase: "input" | "loading" | "reviewing" | "saving";

  /** Dane wygenerowane z API (null przed generowaniem) */
  generationData: GenerationData | null;

  /** Stan ładowania */
  isLoading: boolean;

  /** Błąd jeśli wystąpił */
  error: GenerateViewError | null;
}

/**
 * Dane wygenerowane z API
 */
export interface GenerationData {
  generation: GenerationDTO;
  proposals: ProposedFlashcard[];
}

/**
 * Struktura błędu w widoku
 */
export interface GenerateViewError {
  type: "validation" | "duplicate" | "llm_error" | "network" | "server";
  message: string;
  details?: {
    existingGenerationId?: number;
    retryAfter?: number;
    [key: string]: unknown;
  };
}

/**
 * Props dla komponentu GenerateView
 */
export interface GenerateViewProps {
  /** Opcjonalnie: początkowy tekst (np. z query params) */
  initialText?: string;
}

/**
 * Stan formularza GenerateForm
 */
export interface GenerateFormState {
  sourceText: string;
  charCount: number;
  isValid: boolean;
  validationError: string | null;
}

/**
 * Props dla komponentu GenerateForm
 */
export interface GenerateFormProps {
  onGenerate: (sourceText: string) => Promise<void>;
  isLoading: boolean;
  initialValue?: string;
}

/**
 * Stan listy propozycji ProposalList
 */
export interface ProposalListState {
  /** Set indeksów zaznaczonych propozycji */
  selectedIds: Set<number>;

  /** Mapa edytowanych pól (index -> zmiany) */
  editedProposals: Map<number, ProposalEdit>;

  /** Stan zapisywania */
  isSaving: boolean;
}

/**
 * Edycja propozycji
 */
export interface ProposalEdit {
  front?: string; // Jeśli undefined, bez zmian
  back?: string; // Jeśli undefined, bez zmian
}

/**
 * Props dla komponentu ProposalList
 */
export interface ProposalListProps {
  proposals: ProposedFlashcard[];
  generationId: number;
  onSave: (flashcards: FlashcardCreateCommand[]) => Promise<void>;
}

/**
 * Props dla komponentu ProposalCard
 */
export interface ProposalCardProps {
  proposal: ProposedFlashcard;
  index: number;
  isSelected: boolean;
  editedValues?: ProposalEdit; // Aktualne edycje (jeśli są)
  onToggleSelect: (index: number, checked: boolean) => void;
  onEdit: (index: number, field: "front" | "back", value: string) => void;
}

/**
 * Props dla komponentu CharacterCounter
 */
export interface CharacterCounterProps {
  current: number;
  min: number;
  max: number;
  isValid: boolean;
}

/**
 * Props dla komponentu LoadingIndicator
 */
export interface LoadingIndicatorProps {
  text?: string;
  subtext?: string;
}

/**
 * Props dla komponentu ProposalSection
 */
export interface ProposalSectionProps {
  generationData: GenerationData;
  onSave: (flashcards: FlashcardCreateCommand[]) => Promise<void>;
}
