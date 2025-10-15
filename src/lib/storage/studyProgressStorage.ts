import type { StudyProgressStorage, SM2ReviewData } from "@/types";

const STORAGE_KEY = "study_progress_test_user"; // MVP: hardcoded user
const STORAGE_VERSION = 1;

/**
 * Service zarządzający przechowywaniem postępów nauki w localStorage
 *
 * Przechowuje dane SM-2 (easiness, interval, repetitions, next_review)
 * dla każdej fiszki lokalnie w przeglądarce.
 *
 * W MVP nie synchronizujemy z backendem - wszystko działa offline.
 */
class StudyProgressStorageService {
  /**
   * Załaduj dane z localStorage
   *
   * @returns Dane postępów lub pusty storage jeśli brak/błąd
   */
  load(): StudyProgressStorage {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return this.createEmpty();
      }

      const data = JSON.parse(raw) as StudyProgressStorage;

      // Walidacja schema version
      if (data.version !== STORAGE_VERSION) {
        console.warn("Storage version mismatch, resetting");
        return this.createEmpty();
      }

      return data;
    } catch (error) {
      console.error("Failed to load study progress:", error);
      return this.createEmpty();
    }
  }

  /**
   * Zapisz dane do localStorage
   *
   * @param data - Dane postępów do zapisania
   */
  save(data: StudyProgressStorage): void {
    try {
      const updated = {
        ...data,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save study progress:", error);
      // Graceful degradation - kontynuuj bez zapisywania
    }
  }

  /**
   * Update pojedynczej karty
   *
   * @param flashcardId - ID fiszki do aktualizacji
   * @param sm2Data - Nowe dane SM-2 (bez flashcard_id)
   */
  updateCard(flashcardId: number, sm2Data: Omit<SM2ReviewData, "flashcard_id">): void {
    const storage = this.load();

    storage.reviews[flashcardId] = {
      ...sm2Data,
      flashcard_id: flashcardId,
      last_reviewed: new Date().toISOString(),
    };

    this.save(storage);
  }

  /**
   * Pobierz dane pojedynczej karty
   *
   * @param flashcardId - ID fiszki
   * @returns Dane SM-2 lub null jeśli brak
   */
  getCard(flashcardId: number): SM2ReviewData | null {
    const storage = this.load();
    return storage.reviews[flashcardId] || null;
  }

  /**
   * Wyczyść wszystkie dane
   * Usuwa klucz z localStorage
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Stwórz pusty storage
   *
   * @returns Nowy pusty storage z aktualnym timestampem
   */
  private createEmpty(): StudyProgressStorage {
    return {
      reviews: {},
      lastUpdated: new Date().toISOString(),
      version: STORAGE_VERSION,
    };
  }
}

export const studyProgressStorage = new StudyProgressStorageService();
