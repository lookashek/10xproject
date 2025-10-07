import type { SM2Quality, SM2ReviewData, SM2Params, SM2Result } from '@/types';

const DEFAULT_PARAMS: SM2Params = {
  minEasiness: 1.3,
  maxEasiness: 2.5,
  initialEasiness: 2.5
};

/**
 * Implementacja algorytmu SM-2 (SuperMemo 2) dla spaced repetition
 * 
 * Algorytm oblicza optymalne interwały powtórek na podstawie jakości odpowiedzi użytkownika.
 * SM-2 to klasyczny algorytm używany w systemach nauki fiszek.
 */
class SM2Algorithm {
  private params: SM2Params;

  constructor(params: SM2Params = DEFAULT_PARAMS) {
    this.params = params;
  }

  /**
   * Inicjalizacja nowej karty
   * Tworzy początkowe dane SM-2 dla fiszki, która jeszcze nie była przeglądana
   */
  initializeCard(flashcardId: number): SM2ReviewData {
    return {
      flashcard_id: flashcardId,
      easiness: this.params.initialEasiness,
      interval: 0,
      repetitions: 0,
      next_review: new Date().toISOString(), // od razu dostępna
      last_reviewed: null
    };
  }

  /**
   * Oblicz następny review na podstawie oceny
   * 
   * @param current - Aktualne dane SM-2 fiszki
   * @param quality - Ocena jakości odpowiedzi (0-3)
   * @returns Nowe dane SM-2 po ocenie
   */
  review(current: SM2ReviewData, quality: SM2Quality): SM2ReviewData {
    // 1. Oblicz nowy E-Factor według oryginalnej formuły SM-2
    let newEasiness = current.easiness + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
    
    // Clamp E-Factor do dozwolonego zakresu
    newEasiness = Math.max(this.params.minEasiness, Math.min(this.params.maxEasiness, newEasiness));
    
    // 2. Oblicz nowy interval i repetitions
    let newInterval: number;
    let newRepetitions: number;
    
    if (quality < 2) {
      // Quality 0 lub 1: reset (Again/Hard)
      newInterval = 0;
      newRepetitions = 0;
    } else {
      // Quality 2 lub 3: (Good/Easy)
      newRepetitions = current.repetitions + 1;
      
      if (newRepetitions === 1) {
        newInterval = 1; // 1 dzień
      } else if (newRepetitions === 2) {
        newInterval = 6; // 6 dni
      } else {
        newInterval = Math.round(current.interval * newEasiness);
      }
      
      // Quality 3 (Easy): bonus interval
      if (quality === 3) {
        newInterval = Math.round(newInterval * 1.3);
      }
    }
    
    // 3. Oblicz next_review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
    
    return {
      flashcard_id: current.flashcard_id,
      easiness: newEasiness,
      interval: newInterval,
      repetitions: newRepetitions,
      next_review: nextReviewDate.toISOString(),
      last_reviewed: new Date().toISOString()
    };
  }

  /**
   * Sprawdź czy karta jest gotowa do powtórki
   * 
   * @param sm2Data - Dane SM-2 fiszki
   * @returns true jeśli fiszka powinna być pokazana (next_review <= now)
   */
  isDue(sm2Data: SM2ReviewData): boolean {
    const nextReview = new Date(sm2Data.next_review);
    const now = new Date();
    return nextReview <= now;
  }

  /**
   * Sortuj karty według priorytetu dla sesji nauki
   * 
   * Priorytet:
   * 1. Karty due (gotowe do powtórki) - najstarsze pierwsze
   * 2. Nowe karty (repetitions = 0)
   * 3. Pozostałe karty - najbliższy next_review pierwsze
   */
  sortByPriority<T extends { sm2Data: SM2ReviewData }>(cards: T[]): T[] {
    return [...cards].sort((a, b) => {
      const aDue = this.isDue(a.sm2Data);
      const bDue = this.isDue(b.sm2Data);
      
      // 1. Due cards first
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;
      
      // 2. Among due cards: starsze pierwsze (earliest next_review)
      if (aDue && bDue) {
        return new Date(a.sm2Data.next_review).getTime() - 
               new Date(b.sm2Data.next_review).getTime();
      }
      
      // 3. Nowe karty (repetitions = 0) przed learned
      if (a.sm2Data.repetitions === 0 && b.sm2Data.repetitions > 0) return -1;
      if (a.sm2Data.repetitions > 0 && b.sm2Data.repetitions === 0) return 1;
      
      // 4. Reszta: closest next_review first
      return new Date(a.sm2Data.next_review).getTime() - 
             new Date(b.sm2Data.next_review).getTime();
    });
  }
}

export const sm2Algorithm = new SM2Algorithm();

