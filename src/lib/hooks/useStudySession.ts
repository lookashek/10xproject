/**
 * useStudySession - Główny hook zarządzający sesją nauki
 * 
 * Odpowiada za:
 * - Ładowanie fiszek z API
 * - Integrację z algorytmem SM-2
 * - Zarządzanie stanem sesji (active, completed, empty)
 * - Kolejkowanie i sortowanie kart
 * - Tracking statystyk sesji
 * - Persistencję w localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  StudySessionState, 
  FlashcardWithProgress, 
  SM2Quality,
  SessionStats,
  ErrorState,
  FlashcardDTO
} from '@/types';
import { fetchFlashcards } from '@/lib/api/flashcards';
import { sm2Algorithm } from '@/lib/algorithms/sm2';
import { studyProgressStorage } from '@/lib/storage/studyProgressStorage';

/**
 * Pomocnicza funkcja sortująca karty według priorytetu
 */
function sortCardsByPriority(cards: FlashcardWithProgress[]): FlashcardWithProgress[] {
  return sm2Algorithm.sortByPriority(cards);
}

export function useStudySession() {
  const [sessionState, setSessionState] = useState<StudySessionState>({ 
    type: 'initializing' 
  });
  const [cardsQueue, setCardsQueue] = useState<FlashcardWithProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [error, setError] = useState<ErrorState>(null);

  /**
   * Inicjalizacja sesji nauki
   * Pobiera fiszki, łączy z danymi SM-2, sortuje i uruchamia sesję
   */
  const initializeSession = useCallback(async () => {
    try {
      setSessionState({ type: 'initializing' });
      setError(null);

      // 1. Pobierz wszystkie fiszki (max 100 w MVP)
      const response = await fetchFlashcards({ limit: 100 });
      const flashcards: FlashcardDTO[] = response.data;

      if (flashcards.length === 0) {
        setSessionState({ type: 'empty' });
        return;
      }

      // 2. Załaduj progress z localStorage
      const progressData = studyProgressStorage.load();

      // 3. Stwórz FlashcardWithProgress dla każdej fiszki
      const cardsWithProgress: FlashcardWithProgress[] = flashcards.map(fc => {
        const sm2Data = progressData.reviews[fc.id] || 
          sm2Algorithm.initializeCard(fc.id);
        const isDue = sm2Algorithm.isDue(sm2Data);
        
        return { flashcard: fc, sm2Data, isDue };
      });

      // 4. Sortuj: due first, potem nowe, potem reszta
      const sortedCards = sortCardsByPriority(cardsWithProgress);

      setCardsQueue(sortedCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionState({ 
        type: 'active', 
        currentCard: sortedCards[0],
        isFlipped: false 
      });
      
      // 5. Inicjalizacja stats
      setSessionStats({
        totalReviewed: 0,
        durationSeconds: 0,
        ratings: { again: 0, hard: 0, good: 0, easy: 0 },
        startedAt: new Date().toISOString(),
        completedAt: ''
      });

    } catch (err) {
      console.error('Failed to initialize study session:', err);
      setError({ 
        message: 'Nie udało się załadować fiszek',
        code: 'INTERNAL_SERVER_ERROR' 
      });
      setSessionState({ type: 'empty' });
    }
  }, []);

  // Inicjalizacja przy montowaniu komponentu
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  /**
   * Flip karty (pokazanie odpowiedzi)
   */
  const flipCard = useCallback(() => {
    if (sessionState.type === 'active' && !isFlipped) {
      setIsFlipped(true);
      setSessionState({ 
        ...sessionState, 
        isFlipped: true 
      });
    }
  }, [sessionState, isFlipped]);

  /**
   * Update statystyk sesji po ocenie
   */
  const updateSessionStats = useCallback((quality: SM2Quality) => {
    setSessionStats(prev => {
      if (!prev) return prev;
      
      const ratingKey = ['again', 'hard', 'good', 'easy'][quality] as keyof SessionStats['ratings'];
      
      return {
        ...prev,
        totalReviewed: prev.totalReviewed + 1,
        ratings: {
          ...prev.ratings,
          [ratingKey]: prev.ratings[ratingKey] + 1
        }
      };
    });
  }, []);

  /**
   * Zakończenie sesji
   */
  const completeSession = useCallback(() => {
    if (!sessionStats) return;

    const finalStats: SessionStats = {
      ...sessionStats,
      completedAt: new Date().toISOString(),
      durationSeconds: Math.floor(
        (Date.now() - new Date(sessionStats.startedAt).getTime()) / 1000
      )
    };
    
    setSessionStats(finalStats);
    setSessionState({ type: 'completed', stats: finalStats });
  }, [sessionStats]);

  /**
   * Ocena fiszki i przejście do następnej
   */
  const rateCard = useCallback((quality: SM2Quality) => {
    if (sessionState.type !== 'active' || !isFlipped) return;

    const currentCard = cardsQueue[currentIndex];
    
    // 1. Uruchom algorytm SM-2
    const sm2Result = sm2Algorithm.review(currentCard.sm2Data, quality);
    
    // 2. Zapisz do localStorage
    studyProgressStorage.updateCard(currentCard.flashcard.id, {
      easiness: sm2Result.easiness,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      next_review: sm2Result.next_review,
      last_reviewed: sm2Result.last_reviewed
    });
    
    // 3. Update stats
    updateSessionStats(quality);
    
    // 4. Przejdź do następnej karty
    const nextIndex = currentIndex + 1;
    
    if (nextIndex >= cardsQueue.length) {
      // Sesja zakończona
      completeSession();
    } else {
      setCurrentIndex(nextIndex);
      setIsFlipped(false);
      setSessionState({
        type: 'active',
        currentCard: cardsQueue[nextIndex],
        isFlipped: false
      });
    }
  }, [sessionState, cardsQueue, currentIndex, isFlipped, updateSessionStats, completeSession]);

  /**
   * Zakończenie sesji (manual exit)
   */
  const exitSession = useCallback(() => {
    // Nawigacja obsługiwana przez komponent (window.location lub Astro navigation)
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  }, []);

  /**
   * Restart sesji
   */
  const restartSession = useCallback(() => {
    setSessionState({ type: 'initializing' });
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats(null);
    initializeSession();
  }, [initializeSession]);

  return {
    sessionState,
    currentIndex,
    totalCards: cardsQueue.length,
    reviewedCount: sessionStats?.totalReviewed || 0,
    remainingCount: Math.max(0, cardsQueue.length - currentIndex - 1),
    isFlipped,
    flipCard,
    rateCard,
    exitSession,
    restartSession,
    error
  };
}

