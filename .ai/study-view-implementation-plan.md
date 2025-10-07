# Plan implementacji widoku Sesji Nauki

## 1. Przegląd

Widok Sesji Nauki (`/study`) to pełnoekranowy widok umożliwiający użytkownikom efektywną naukę fiszek z wykorzystaniem algorytmu SM-2 (Supermemo 2) dla spaced repetition. Głównym celem widoku jest:
- Prezentacja fiszek w sposób promujący efektywną naukę (minimal UI, distraction-free)
- Implementacja algorytmu powtórek SM-2 działającego lokalnie w przeglądarce
- Śledzenie postępów nauki użytkownika (liczba przejrzanych fiszek, progress bar)
- Umożliwienie oceny przyswoienia każdej fiszki (4 poziomy: Again, Hard, Good, Easy)
- Wsparcie dla keyboard navigation i shortcuts (1-4 dla oceny, Spacja dla flip)
- Zapisywanie stanu nauki w localStorage (MVP - bez backendu)

Widok charakteryzuje się:
- **Pełnoekranowym interfejsem** bez głównej nawigacji i header (focus mode)
- **Minimalnym UI** - tylko niezbędne elementy (progress, fiszka, przyciski oceny)
- **Smooth animations** - flip effect dla fiszki, transitions między kartami
- **Accessibility** - pełne wsparcie dla keyboard navigation i screen readers
- **Progressive enhancement** - działanie offline dzięki localStorage

## 2. Routing widoku

### Główny widok sesji nauki
- **Ścieżka**: `/study`
- **Plik**: `src/pages/study.astro`
- **Typ**: Chroniony widok (wymaga uwierzytelnienia w przyszłości)
- **Query params**: Brak w MVP (w przyszłości: `?due=true` dla fiszek do powtórki)

### Nawigacja
- Wejście: Z dashboard przez kafelek "Sesja nauki" lub bezpośredni link `/study`
- Wyjście: Przycisk "Zakończ sesję" w header → przekierowanie do `/dashboard`
- Po zakończeniu sesji: Automatyczne przekierowanie do `/dashboard` z podsumowaniem

## 3. Struktura komponentów

### Hierarchia komponentów

```
study.astro (Astro page)
└── StudySessionView (React)
    ├── StudySessionHeader
    │   ├── StudyProgressBar
    │   ├── StudyStats (cards remaining, reviewed count)
    │   └── ExitButton
    ├── StudySessionContent (conditional rendering)
    │   ├── LoadingState (when initializing)
    │   ├── EmptyState (no flashcards available)
    │   ├── CompletedState (session finished)
    │   └── ActiveSession (main study flow)
    │       ├── StudyCard
    │       │   ├── CardFront (default visible)
    │       │   └── CardBack (shown after flip)
    │       ├── FlipButton (visible when front shown)
    │       └── StudyControls (visible after flip)
    │           ├── RatingButton × 4 (Again, Hard, Good, Easy)
    │           └── KeyboardHints
    └── ToasterProvider (for notifications)
```

### Dodatkowe komponenty pomocnicze
- **StudySessionSkeleton** - loading UI podczas inicjalizacji
- **CompletionSummary** - podsumowanie sesji (liczba fiszek, czas nauki)
- **KeyboardListener** - global keyboard event handler

## 4. Szczegóły komponentów

### 4.1. StudySessionView (React)

**Opis**: Główny kontener widoku sesji nauki. Odpowiada za zarządzanie stanem sesji, inicjalizację algorytmu SM-2, obsługę keyboard shortcuts oraz orchestration pomiędzy wszystkimi podkomponentami.

**Główne elementy**:
- `StudySessionHeader` - zawsze widoczny na górze
- Warunkowe renderowanie głównego contentu:
  - `LoadingState` podczas pobierania fiszek i inicjalizacji
  - `EmptyState` gdy brak fiszek do nauki
  - `ActiveSession` podczas aktywnej sesji
  - `CompletedState` po zakończeniu sesji
- Global keyboard event listeners

**Obsługiwane interakcje**:
- Inicjalne załadowanie fiszek z API
- Filtrowanie fiszek ready for review (według algorytmu SM-2)
- Obsługa keyboard shortcuts:
  - `Spacja` - flip fiszki (pokazanie odpowiedzi)
  - `1` - ocena "Again" (nie pamiętam)
  - `2` - ocena "Hard" (pamiętam słabo)
  - `3` - ocena "Good" (pamiętam)
  - `4` - ocena "Easy" (pamiętam dobrze)
  - `Escape` - zakończenie sesji (z potwierdzeniem)
- Przejście do następnej fiszki po ocenie
- Zakończenie sesji (manual lub automatyczne)

**Obsługiwana walidacja**:
- Sprawdzenie czy są dostępne fiszki do nauki
- Walidacja localStorage data (schema validation)
- Obsługa błędów API podczas ładowania fiszek
- Zabezpieczenie przed multiple concurrent key presses

**Typy**:
- `StudySessionViewProps` (props)
- `StudySessionState` (stan sesji)
- `FlashcardWithProgress` (fiszka + SM-2 metadata)
- `SM2ReviewData` (dane z localStorage)
- `ErrorState` (stan błędu)

**Propsy**:
```typescript
type StudySessionViewProps = {
  // Brak propsów - wszystkie dane ładowane dynamicznie
};
```

### 4.2. StudySessionHeader (React)

**Opis**: Kompaktowy header widoczny na górze ekranu przez cały czas trwania sesji. Zawiera progress bar, statystyki i przycisk wyjścia.

**Główne elementy**:
- Container z klasami `fixed top-0 left-0 right-0 z-50` (always on top)
- `StudyProgressBar` - wizualny progress (fiszka X z Y)
- Statystyki w formie ikon z licznikami:
  - Ikona karty + liczba pozostałych fiszek
  - Ikona checkmark + liczba przejrzanych
- `ExitButton` - przycisk "Zakończ sesję"

**Obsługiwane interakcje**:
- Kliknięcie "Zakończ sesję" → wywołanie callback `onExit`
- Pokazanie confirmation dialog jeśli sesja w trakcie

**Obsługiwana walidacja**:
- Brak - komponent prezentacyjny

**Typy**:
- `StudySessionHeaderProps` (props)

**Propsy**:
```typescript
type StudySessionHeaderProps = {
  currentIndex: number; // 0-based
  totalCards: number;
  reviewedCount: number;
  remainingCount: number;
  onExit: () => void;
};
```

### 4.3. StudyProgressBar (React)

**Opis**: Wizualny pasek postępu pokazujący ile fiszek zostało przejrzanych w stosunku do całkowitej liczby.

**Główne elementy**:
- Progress bar (shadcn/ui Progress lub custom)
- Tekst w formacie "Fiszka {current} z {total}"
- Procent postępu wyliczony jako `(current / total) * 100`

**Obsługiwane interakcje**:
- Brak - tylko wizualizacja

**Obsługiwana walidacja**:
- Obsługa edge case gdy total = 0

**Typy**:
- `StudyProgressBarProps` (props)

**Propsy**:
```typescript
type StudyProgressBarProps = {
  current: number; // 1-based dla UI
  total: number;
};
```

### 4.4. StudyCard (React)

**Opis**: Centralna, duża karta wyświetlająca przód lub tył fiszki. Wspiera flip animation i jest głównym focus point całego widoku.

**Główne elementy**:
- Container z klasami centrującymi i maksymalizującymi rozmiar
- `CardFront` - przód fiszki (pytanie)
- `CardBack` - tył fiszki (odpowiedź)
- CSS 3D flip animation lub smooth fade transition
- Semantic HTML: użycie `<article>` dla accessibility

**Obsługiwane interakcje**:
- Automatyczna animacja flip po zmianie `isFlipped` state
- Kliknięcie na kartę → flip (opcjonalnie, głównie keyboard)

**Obsługiwana walidacja**:
- Sanityzacja HTML w treści fiszki (XSS prevention)
- Obsługa bardzo długich tekstów (scroll jeśli needed)
- Responsive font size (większa czcionka dla krótkich tekstów)

**Typy**:
- `StudyCardProps` (props)
- `FlashcardDTO` (dane fiszki)

**Propsy**:
```typescript
type StudyCardProps = {
  flashcard: FlashcardDTO;
  isFlipped: boolean;
  onFlip?: () => void; // Opcjonalne click-to-flip
};
```

### 4.5. FlipButton (React)

**Opis**: Przycisk wyświetlany gdy pokazany jest tylko przód fiszki. Zachęca użytkownika do sprawdzenia odpowiedzi.

**Główne elementy**:
- Duży, wyraźny przycisk (shadcn/ui Button variant="default" size="lg")
- Tekst: "Pokaż odpowiedź" lub "Odkryj" + ikona
- Keyboard hint: "(Spacja)"
- Animacja pulse/glow dla zwrócenia uwagi

**Obsługiwane interakcje**:
- Kliknięcie → wywołanie `onFlip` callback
- Keyboard: Spacja → to samo

**Obsługiwana walidacja**:
- Brak

**Typy**:
- `FlipButtonProps` (props)

**Propsy**:
```typescript
type FlipButtonProps = {
  onFlip: () => void;
};
```

### 4.6. StudyControls (React)

**Opis**: Sekcja z 4 przyciskami oceny widoczna dopiero po pokazaniu odpowiedzi. Umożliwia użytkownikowi ocenę jak dobrze zapamiętał fiszkę.

**Główne elementy**:
- Grid lub flex container z 4 przyciskami:
  1. **Again** (Powtórz) - czerwony, quality=0
  2. **Hard** (Trudne) - pomarańczowy, quality=1
  3. **Good** (Dobre) - zielony, quality=2
  4. **Easy** (Łatwe) - niebieski, quality=3
- Każdy przycisk ma:
  - Ikonę (Lucide: X, AlertCircle, Check, Star)
  - Tekst polskiej etykiety
  - Keyboard hint (1, 2, 3, 4)
  - Disabled state (gdy `!isFlipped`)
- Responsive layout: 4 kolumny desktop, 2×2 grid mobile

**Obsługiwane interakcje**:
- Kliknięcie przycisku → wywołanie `onRate(quality)`
- Keyboard shortcuts 1-4 → to samo
- Disabled gdy fiszka nie jest flipped

**Obsługiwana walidacja**:
- Przyciski disabled jeśli `!isFlipped`
- Zabezpieczenie przed double-click (disable po pierwszym kliknięciu)

**Typy**:
- `StudyControlsProps` (props)
- `SM2Quality` (0-3)

**Propsy**:
```typescript
type StudyControlsProps = {
  isFlipped: boolean;
  onRate: (quality: SM2Quality) => void;
  isProcessing: boolean; // podczas transition do następnej karty
};
```

### 4.7. EmptyState (React)

**Opis**: Komponent wyświetlany gdy użytkownik nie ma żadnych fiszek do nauki. Zachęca do dodania fiszek.

**Główne elementy**:
- Wycentrowany container
- Ikona (BookOpen lub GraduationCap z lucide-react)
- Nagłówek: "Brak fiszek do nauki"
- Opis: "Nie masz jeszcze żadnych fiszek. Stwórz je ręcznie lub wygeneruj za pomocą AI."
- Przyciski CTA:
  - "Dodaj fiszkę" → link do `/flashcards`
  - "Generuj fiszki" → link do `/generate`

**Obsługiwane interakcje**:
- Kliknięcie przycisków → nawigacja do odpowiednich widoków

**Obsługiwana walidacja**:
- Brak

**Typy**:
- Brak propsów

**Propsy**: Brak

### 4.8. CompletedState (React)

**Opis**: Ekran gratulacyjny wyświetlany po zakończeniu sesji nauki. Pokazuje statystyki i umożliwia powrót do dashboard lub rozpoczęcie nowej sesji.

**Główne elementy**:
- Wycentrowany container
- Ikona sukcesu (Trophy, Star lub CheckCircle)
- Nagłówek: "Świetna robota!"
- Statystyki sesji:
  - "Przejrzałeś {count} fiszek"
  - "Czas nauki: {duration}"
  - Breakdown ocen: Again: X, Hard: Y, Good: Z, Easy: W
- Przyciski akcji:
  - "Powrót do panelu" → link do `/dashboard`
  - "Rozpocznij nową sesję" → reset state i restart

**Obsługiwane interakcje**:
- Kliknięcie "Powrót do panelu" → nawigacja do dashboard
- Kliknięcie "Rozpocznij nową sesję" → wywołanie `onRestart` callback
- Auto-redirect po 10 sekundach (z countdown)

**Obsługiwana walidacja**:
- Formatowanie czasu (mm:ss)

**Typy**:
- `CompletedStateProps` (props)
- `SessionStats` (statystyki sesji)

**Propsy**:
```typescript
type CompletedStateProps = {
  stats: SessionStats;
  onRestart: () => void;
  onExit: () => void;
};
```

### 4.9. LoadingState (React)

**Opis**: Skeleton UI wyświetlany podczas ładowania fiszek z API i inicjalizacji algorytmu SM-2.

**Główne elementy**:
- Pełnoekranowy container
- Spinner lub skeleton card
- Tekst: "Przygotowuję sesję nauki..."
- Progress indicator (opcjonalnie)

**Obsługiwane interakcje**:
- Brak - statyczny loading state

**Obsługiwana walidacja**:
- Brak

**Typy**:
- Brak propsów

**Propsy**: Brak

## 5. Typy

### 5.1. Nowe typy ViewModel dla widoku Study Session

Dodać do `src/types.ts`:

```typescript
// ============================================================================
// STUDY SESSION VIEW MODELS (Frontend specific types)
// ============================================================================

/**
 * Poziom jakości odpowiedzi w algorytmie SM-2
 * 0 = Again (całkowite zapomnienie)
 * 1 = Hard (z trudnością)
 * 2 = Good (poprawnie)
 * 3 = Easy (łatwo)
 */
export type SM2Quality = 0 | 1 | 2 | 3;

/**
 * Etykiety dla przycisków oceny
 */
export type RatingLabel = {
  quality: SM2Quality;
  label: string;
  description: string;
  color: 'red' | 'orange' | 'green' | 'blue';
  icon: string; // nazwa ikony z lucide-react
  keyboardShortcut: '1' | '2' | '3' | '4';
};

/**
 * Dane SM-2 przechowywane dla każdej fiszki w localStorage
 */
export type SM2ReviewData = {
  /** ID fiszki */
  flashcard_id: number;
  
  /** Współczynnik łatwości (E-Factor), zakres 1.3 - 2.5 */
  easiness: number;
  
  /** Interwał powtórek w dniach */
  interval: number;
  
  /** Liczba prawidłowych powtórzeń z rzędu */
  repetitions: number;
  
  /** Data następnej zaplanowanej powtórki (ISO string) */
  next_review: string;
  
  /** Data ostatniej powtórki (ISO string) */
  last_reviewed: string | null;
};

/**
 * Fiszka wraz z danymi SM-2 progress
 */
export type FlashcardWithProgress = {
  flashcard: FlashcardDTO;
  sm2Data: SM2ReviewData;
  isDue: boolean; // czy fiszka jest gotowa do powtórki
};

/**
 * Stan sesji nauki
 */
export type StudySessionState = 
  | { type: 'initializing' }
  | { type: 'empty' } // brak fiszek
  | { type: 'active'; currentCard: FlashcardWithProgress; isFlipped: boolean }
  | { type: 'completed'; stats: SessionStats };

/**
 * Statystyki sesji nauki
 */
export type SessionStats = {
  /** Całkowita liczba przejrzanych fiszek */
  totalReviewed: number;
  
  /** Czas trwania sesji w sekundach */
  durationSeconds: number;
  
  /** Breakdown ocen */
  ratings: {
    again: number; // quality 0
    hard: number;  // quality 1
    good: number;  // quality 2
    easy: number;  // quality 3
  };
  
  /** Data rozpoczęcia sesji (ISO string) */
  startedAt: string;
  
  /** Data zakończenia sesji (ISO string) */
  completedAt: string;
};

/**
 * Props dla głównego widoku sesji nauki
 */
export type StudySessionViewProps = {
  // Brak propsów - wszystkie dane ładowane dynamicznie
};

/**
 * Props dla header sesji nauki
 */
export type StudySessionHeaderProps = {
  currentIndex: number;
  totalCards: number;
  reviewedCount: number;
  remainingCount: number;
  onExit: () => void;
};

/**
 * Props dla progress bar
 */
export type StudyProgressBarProps = {
  current: number; // 1-based
  total: number;
};

/**
 * Props dla karty fiszki
 */
export type StudyCardProps = {
  flashcard: FlashcardDTO;
  isFlipped: boolean;
  onFlip?: () => void;
};

/**
 * Props dla przycisku flip
 */
export type FlipButtonProps = {
  onFlip: () => void;
};

/**
 * Props dla kontrolek oceny
 */
export type StudyControlsProps = {
  isFlipped: boolean;
  onRate: (quality: SM2Quality) => void;
  isProcessing: boolean;
};

/**
 * Props dla ekranu ukończenia
 */
export type CompletedStateProps = {
  stats: SessionStats;
  onRestart: () => void;
  onExit: () => void;
};

/**
 * Konfiguracja localStorage dla study session
 */
export type StudyProgressStorage = {
  /** Mapa flashcard_id → SM2ReviewData */
  reviews: Record<number, SM2ReviewData>;
  
  /** Timestamp ostatniej aktualizacji */
  lastUpdated: string;
  
  /** Wersja schema (dla migracji w przyszłości) */
  version: number;
};
```

### 5.2. Typy pomocnicze (utility types)

Utworzyć plik `src/lib/algorithms/sm2.ts`:

```typescript
import type { SM2Quality, SM2ReviewData } from '@/types';

/**
 * Parametry algorytmu SM-2
 */
export type SM2Params = {
  /** Minimalny E-Factor (default: 1.3) */
  minEasiness: number;
  
  /** Maksymalny E-Factor (default: 2.5) */
  maxEasiness: number;
  
  /** Początkowy E-Factor dla nowych fiszek (default: 2.5) */
  initialEasiness: number;
};

/**
 * Wynik kalkulacji SM-2
 */
export type SM2Result = {
  /** Nowy E-Factor */
  easiness: number;
  
  /** Nowy interwał w dniach */
  interval: number;
  
  /** Nowa liczba repetitions */
  repetitions: number;
  
  /** Data następnej powtórki (ISO string) */
  nextReview: string;
};
```

## 6. Zarządzanie stanem

### 6.1. Custom hook: useStudySession

**Lokalizacja**: `src/lib/hooks/useStudySession.ts`

**Cel**: Główny hook zarządzający całą logiką sesji nauki - ładowanie fiszek, algorytm SM-2, kolejkowanie kart, tracking postępów.

**Implementacja**:
```typescript
import { useState, useEffect, useCallback } from 'react';
import type { 
  StudySessionState, 
  FlashcardWithProgress, 
  SM2Quality,
  SessionStats,
  ErrorState 
} from '@/types';
import { fetchFlashcards } from '@/lib/api/flashcards';
import { sm2Algorithm } from '@/lib/algorithms/sm2';
import { studyProgressStorage } from '@/lib/storage/studyProgressStorage';

export function useStudySession() {
  const [sessionState, setSessionState] = useState<StudySessionState>({ 
    type: 'initializing' 
  });
  const [cardsQueue, setCardsQueue] = useState<FlashcardWithProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [error, setError] = useState<ErrorState>(null);

  // Inicjalizacja sesji
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      // 1. Pobierz wszystkie fiszki
      const response = await fetchFlashcards({ limit: 100 });
      const flashcards = response.data;

      if (flashcards.length === 0) {
        setSessionState({ type: 'empty' });
        return;
      }

      // 2. Załaduj progress z localStorage
      const progressData = studyProgressStorage.load();

      // 3. Stwórz FlashcardWithProgress dla każdej fiszki
      const cardsWithProgress = flashcards.map(fc => {
        const sm2Data = progressData.reviews[fc.id] || 
          sm2Algorithm.initializeCard(fc.id);
        const isDue = sm2Algorithm.isDue(sm2Data);
        
        return { flashcard: fc, sm2Data, isDue };
      });

      // 4. Sortuj: due first, potem nowe, potem reszta
      const sortedCards = sortCardsByPriority(cardsWithProgress);

      setCardsQueue(sortedCards);
      setCurrentIndex(0);
      setSessionState({ 
        type: 'active', 
        currentCard: sortedCards[0],
        isFlipped: false 
      });
      
      // Inicjalizacja stats
      setSessionStats({
        totalReviewed: 0,
        durationSeconds: 0,
        ratings: { again: 0, hard: 0, good: 0, easy: 0 },
        startedAt: new Date().toISOString(),
        completedAt: ''
      });

    } catch (err) {
      setError({ 
        message: 'Nie udało się załadować fiszek',
        code: 'INTERNAL_SERVER_ERROR' 
      });
      setSessionState({ type: 'empty' });
    }
  };

  // Flip karty
  const flipCard = useCallback(() => {
    if (sessionState.type === 'active') {
      setIsFlipped(true);
      setSessionState({ ...sessionState, isFlipped: true });
    }
  }, [sessionState]);

  // Ocena fiszki
  const rateCard = useCallback((quality: SM2Quality) => {
    if (sessionState.type !== 'active' || !isFlipped) return;

    const currentCard = cardsQueue[currentIndex];
    
    // 1. Uruchom algorytm SM-2
    const sm2Result = sm2Algorithm.review(currentCard.sm2Data, quality);
    
    // 2. Zapisz do localStorage
    studyProgressStorage.updateCard(currentCard.flashcard.id, sm2Result);
    
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
  }, [sessionState, cardsQueue, currentIndex, isFlipped]);

  // Zakończenie sesji
  const completeSession = () => {
    const finalStats = {
      ...sessionStats!,
      completedAt: new Date().toISOString(),
      durationSeconds: Math.floor(
        (Date.now() - new Date(sessionStats!.startedAt).getTime()) / 1000
      )
    };
    
    setSessionStats(finalStats);
    setSessionState({ type: 'completed', stats: finalStats });
  };

  // Update stats helper
  const updateSessionStats = (quality: SM2Quality) => {
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
  };

  // Exit sesji
  const exitSession = useCallback(() => {
    // Opcjonalnie: save partial progress
    // Nawigacja do dashboard
  }, []);

  // Restart sesji
  const restartSession = useCallback(() => {
    setSessionState({ type: 'initializing' });
    setCurrentIndex(0);
    setIsFlipped(false);
    initializeSession();
  }, []);

  return {
    sessionState,
    currentIndex,
    totalCards: cardsQueue.length,
    reviewedCount: sessionStats?.totalReviewed || 0,
    remainingCount: cardsQueue.length - currentIndex - 1,
    isFlipped,
    flipCard,
    rateCard,
    exitSession,
    restartSession,
    error
  };
}
```

**Eksportowane wartości**:
- `sessionState: StudySessionState` - aktualny stan sesji
- `currentIndex: number` - indeks aktualnej karty
- `totalCards: number` - całkowita liczba kart w kolejce
- `reviewedCount: number` - liczba przejrzanych kart
- `remainingCount: number` - liczba pozostałych kart
- `isFlipped: boolean` - czy aktualna karta jest odwrócona
- `flipCard: () => void` - funkcja do flip karty
- `rateCard: (quality: SM2Quality) => void` - funkcja do oceny karty
- `exitSession: () => void` - funkcja do zakończenia sesji
- `restartSession: () => void` - funkcja do restartu sesji
- `error: ErrorState` - stan błędu

### 6.2. Custom hook: useKeyboardShortcuts

**Lokalizacja**: `src/lib/hooks/useKeyboardShortcuts.ts`

**Cel**: Obsługa keyboard shortcuts dla widoku study session (Spacja, 1-4, Escape).

**Implementacja**:
```typescript
import { useEffect } from 'react';
import type { SM2Quality } from '@/types';

export function useKeyboardShortcuts(
  isActive: boolean,
  isFlipped: boolean,
  onFlip: () => void,
  onRate: (quality: SM2Quality) => void,
  onExit: () => void
) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignoruj jeśli user pisze w input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case ' ':
          event.preventDefault();
          if (!isFlipped) {
            onFlip();
          }
          break;
        
        case '1':
          event.preventDefault();
          if (isFlipped) {
            onRate(0); // Again
          }
          break;
        
        case '2':
          event.preventDefault();
          if (isFlipped) {
            onRate(1); // Hard
          }
          break;
        
        case '3':
          event.preventDefault();
          if (isFlipped) {
            onRate(2); // Good
          }
          break;
        
        case '4':
          event.preventDefault();
          if (isFlipped) {
            onRate(3); // Easy
          }
          break;
        
        case 'Escape':
          event.preventDefault();
          onExit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isActive, isFlipped, onFlip, onRate, onExit]);
}
```

### 6.3. Stan lokalny w komponentach

**StudySessionView**:
- Wykorzystuje hook `useStudySession` (cały stan sesji)
- Wykorzystuje hook `useKeyboardShortcuts` (keyboard events)

**CompletedState**:
- `countdown: number` - countdown do auto-redirect (10s)

**StudyCard**:
- Opcjonalnie: `animationState: 'idle' | 'flipping'` dla kontroli animacji

## 7. Integracja API

### 7.1. API Client - wykorzystanie istniejącego

**Lokalizacja**: `src/lib/api/flashcards.ts` (już istnieje)

**Wykorzystywana funkcja**:
```typescript
// Już zaimplementowana
export async function fetchFlashcards(
  query: FlashcardListQuery = {}
): Promise<FlashcardListResponse>
```

**Wywołanie w study session**:
```typescript
// W useStudySession hook
const response = await fetchFlashcards({ 
  limit: 100 // pobranie wszystkich fiszek (max 100 w MVP)
});
```

### 7.2. Typy żądań i odpowiedzi

**Pobieranie fiszek**:
- **Request**: `GET /api/flashcards?limit=100`
  - Query params: `{ limit: 100 }`
- **Response**: `FlashcardListResponse`
  ```typescript
  {
    data: FlashcardDTO[];
    pagination: PaginationMeta;
  }
  ```

**W przyszłości (poza MVP)**:
- **Request**: `GET /api/study/session` - endpoint zwracający tylko due flashcards
- **Request**: `POST /api/study/review` - endpoint do zapisywania review history

### 7.3. Brak zapisywania na backend w MVP

W MVP wszystkie dane SM-2 są przechowywane lokalnie w localStorage:
- Klucz: `study_progress_{user_id}` (hardcoded user_id dla MVP)
- Wartość: JSON z `StudyProgressStorage`
- Automatyczny save po każdej ocenie fiszki
- Load przy inicjalizacji sesji

## 8. Integracja z localStorage

### 8.1. Storage Service

**Lokalizacja**: `src/lib/storage/studyProgressStorage.ts`

**Implementacja**:
```typescript
import type { StudyProgressStorage, SM2ReviewData } from '@/types';

const STORAGE_KEY = 'study_progress_test_user'; // MVP: hardcoded user
const STORAGE_VERSION = 1;

class StudyProgressStorageService {
  /**
   * Załaduj dane z localStorage
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
        console.warn('Storage version mismatch, resetting');
        return this.createEmpty();
      }
      
      return data;
    } catch (error) {
      console.error('Failed to load study progress:', error);
      return this.createEmpty();
    }
  }

  /**
   * Zapisz dane do localStorage
   */
  save(data: StudyProgressStorage): void {
    try {
      const updated = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save study progress:', error);
    }
  }

  /**
   * Update pojedynczej karty
   */
  updateCard(flashcardId: number, sm2Data: Omit<SM2ReviewData, 'flashcard_id'>): void {
    const storage = this.load();
    
    storage.reviews[flashcardId] = {
      ...sm2Data,
      flashcard_id: flashcardId,
      last_reviewed: new Date().toISOString()
    };
    
    this.save(storage);
  }

  /**
   * Pobierz dane pojedynczej karty
   */
  getCard(flashcardId: number): SM2ReviewData | null {
    const storage = this.load();
    return storage.reviews[flashcardId] || null;
  }

  /**
   * Wyczyść wszystkie dane
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Stwórz pusty storage
   */
  private createEmpty(): StudyProgressStorage {
    return {
      reviews: {},
      lastUpdated: new Date().toISOString(),
      version: STORAGE_VERSION
    };
  }
}

export const studyProgressStorage = new StudyProgressStorageService();
```

## 9. Algorytm SM-2

### 9.1. Implementacja algorytmu

**Lokalizacja**: `src/lib/algorithms/sm2.ts`

**Implementacja**:
```typescript
import type { SM2Quality, SM2ReviewData, SM2Result, SM2Params } from '@/types';

const DEFAULT_PARAMS: SM2Params = {
  minEasiness: 1.3,
  maxEasiness: 2.5,
  initialEasiness: 2.5
};

class SM2Algorithm {
  private params: SM2Params;

  constructor(params: SM2Params = DEFAULT_PARAMS) {
    this.params = params;
  }

  /**
   * Inicjalizacja nowej karty
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
   */
  review(current: SM2ReviewData, quality: SM2Quality): SM2ReviewData {
    // 1. Oblicz nowy E-Factor
    let newEasiness = current.easiness + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
    
    // Clamp E-Factor
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
   */
  isDue(sm2Data: SM2ReviewData): boolean {
    const nextReview = new Date(sm2Data.next_review);
    const now = new Date();
    return nextReview <= now;
  }

  /**
   * Sortuj karty według priorytetu
   */
  sortByPriority(cards: { sm2Data: SM2ReviewData }[]): typeof cards {
    return cards.sort((a, b) => {
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
```

## 10. Interakcje użytkownika

### 10.1. Rozpoczęcie sesji nauki

**Trigger**: Użytkownik klika kafelek "Sesja nauki" w dashboard lub wchodzi na `/study`

**Flow**:
1. Renderowanie `study.astro` page
2. Mount `StudySessionView` component
3. Hook `useStudySession` uruchamia `initializeSession()`
4. Wyświetlenie `LoadingState` (skeleton)
5. Wykonanie `GET /api/flashcards?limit=100`
6. Załadowanie danych SM-2 z localStorage
7. Połączenie flashcards z SM2ReviewData
8. Sortowanie według priorytetu (due first)
9. Ustawienie `sessionState = 'active'` z pierwszą kartą
10. Renderowanie `ActiveSession` z `StudyCard` pokazującym przód pierwszej fiszki

**Walidacja**:
- Jeśli brak fiszek → wyświetlenie `EmptyState`
- Jeśli błąd API → wyświetlenie error toast + `EmptyState`

### 10.2. Pokazanie odpowiedzi (flip karty)

**Trigger**: Użytkownik klika przycisk "Pokaż odpowiedź" lub naciska Spację

**Flow**:
1. Użytkownik klika `FlipButton` lub naciska Spację
2. Event handler wywołuje `flipCard()` z hooka
3. State `isFlipped` zmienia się na `true`
4. `StudyCard` wykonuje flip animation (CSS 3D transform lub fade)
5. Pokazanie tyłu fiszki (odpowiedź)
6. `FlipButton` znika
7. `StudyControls` stają się aktywne (enabled)
8. Keyboard hints dla 1-4 stają się widoczne

**Walidacja**:
- Flip możliwy tylko gdy `isFlipped = false`
- Podczas animacji flip blokada ponownego flip

### 10.3. Ocena fiszki

**Trigger**: Użytkownik klika jeden z przycisków oceny (Again/Hard/Good/Easy) lub naciska 1-4

**Flow**:
1. Użytkownik klika przycisk lub naciska klawisz (1-4)
2. Event handler wywołuje `rateCard(quality)` z hooka
3. Walidacja: możliwe tylko gdy `isFlipped = true`
4. Uruchomienie algorytmu SM-2:
   - Obliczenie nowego E-Factor, interval, repetitions
   - Obliczenie next_review date
5. Zapisanie wyniku do localStorage
6. Update statystyk sesji:
   - Inkrementacja odpowiedniego rating counter (again/hard/good/easy)
   - Inkrementacja totalReviewed
7. Sprawdzenie czy są jeszcze karty:
   - Jeśli tak: przejście do następnej karty
     - Ustawienie `currentIndex++`
     - Reset `isFlipped = false`
     - Smooth transition animation
     - Pokazanie przodu następnej karty
   - Jeśli nie: zakończenie sesji
     - Obliczenie finalnych stats (duration)
     - Przejście do `CompletedState`

**Walidacja**:
- Rating możliwy tylko gdy `isFlipped = true`
- Zabezpieczenie przed double-click (disable przyciski podczas transition)

### 10.4. Zakończenie sesji

**Trigger**: Użytkownik klika "Zakończ sesję" w header, naciska Escape, lub przejrzał wszystkie karty

**Flow - manual exit**:
1. Użytkownik klika "Zakończ sesję" lub naciska Escape
2. Pokazanie confirmation dialog:
   - Tytuł: "Czy na pewno chcesz zakończyć sesję?"
   - Opis: "Twój postęp został zapisany."
   - Przyciski: "Anuluj" / "Zakończ"
3. Jeśli potwierdzi:
   - Nawigacja do `/dashboard`
   - Opcjonalnie: toast "Sesja zakończona"

**Flow - auto completion**:
1. Po ocenie ostatniej karty automatycznie:
2. Obliczenie finalnych stats (duration, breakdown)
3. Przejście do `CompletedState`
4. Wyświetlenie ekranu gratulacyjnego z statystykami
5. Countdown 10s do auto-redirect
6. Opcje: "Powrót do panelu" lub "Rozpocznij nową sesję"

**Walidacja**:
- Confirmation dialog tylko jeśli sesja w trakcie (min. 1 karta przejrzana)

### 10.5. Rozpoczęcie nowej sesji

**Trigger**: Użytkownik klika "Rozpocznij nową sesję" w `CompletedState`

**Flow**:
1. Użytkownik klika przycisk
2. Wywołanie `restartSession()` z hooka
3. Reset state sesji
4. Ponowne wywołanie `initializeSession()`
5. Załadowanie fiszek (z uwzględnieniem nowych SM-2 data)
6. Rozpoczęcie od początku

**Walidacja**:
- Brak - zawsze możliwe z `CompletedState`

## 11. Warunki i walidacja

### 11.1. Walidacja dostępności fiszek

**Komponenty**: `StudySessionView`, hook `useStudySession`

**Warunki**:
- Musi istnieć przynajmniej 1 fiszka w bazie
- Fiszki muszą być poprawnie załadowane z API

**Implementacja**:
```typescript
if (flashcards.length === 0) {
  setSessionState({ type: 'empty' });
  return;
}
```

**Wpływ na UI**:
- Jeśli 0 fiszek → wyświetlenie `EmptyState` z CTA do dodania fiszek

### 11.2. Walidacja localStorage data

**Komponenty**: `studyProgressStorage`

**Warunki**:
- Schema version musi się zgadzać
- JSON musi być valid
- Struktura danych musi być zgodna z `StudyProgressStorage` type

**Implementacja**:
```typescript
try {
  const data = JSON.parse(raw) as StudyProgressStorage;
  
  if (data.version !== STORAGE_VERSION) {
    return this.createEmpty(); // reset
  }
  
  return data;
} catch {
  return this.createEmpty(); // corrupted data
}
```

**Wpływ na UI**:
- Jeśli invalid → silent reset do pustego storage (user zaczyna od nowa)
- Brak error message (graceful degradation)

### 11.3. Walidacja keyboard shortcuts

**Komponenty**: `useKeyboardShortcuts` hook

**Warunki**:
- Shortcuts aktywne tylko gdy sesja jest active
- Rating shortcuts (1-4) aktywne tylko gdy `isFlipped = true`
- Flip shortcut (Spacja) aktywny tylko gdy `isFlipped = false`
- Ignoruj shortcuts gdy focus w input/textarea

**Implementacja**:
```typescript
if (event.target instanceof HTMLInputElement || 
    event.target instanceof HTMLTextAreaElement) {
  return; // ignoruj
}

if (event.key === ' ' && !isFlipped) {
  onFlip();
}

if (['1','2','3','4'].includes(event.key) && isFlipped) {
  onRate(quality);
}
```

**Wpływ na UI**:
- Buttons disabled odpowiednio do stanu
- Keyboard hints pokazują tylko dostępne akcje

### 11.4. Walidacja SM-2 calculations

**Komponenty**: `SM2Algorithm`

**Warunki**:
- E-Factor musi być w zakresie 1.3 - 2.5
- Interval musi być >= 0
- Repetitions musi być >= 0
- next_review musi być valid date

**Implementacja**:
```typescript
newEasiness = Math.max(
  this.params.minEasiness, 
  Math.min(this.params.maxEasiness, newEasiness)
);
```

**Wpływ na UI**:
- Brak bezpośredniego wpływu (internal logic)
- Zapewnia poprawność algorytmu

### 11.5. Walidacja transition state

**Komponenty**: `StudyControls`

**Warunki**:
- Rating buttons disabled podczas transition do następnej karty
- Zapobiega double-click

**Implementacja**:
```typescript
<StudyControls 
  isFlipped={isFlipped}
  onRate={rateCard}
  isProcessing={isTransitioning} // disable buttons
/>
```

**Wpływ na UI**:
- Buttons disabled + loading spinner podczas transition
- Prevents race conditions

## 12. Obsługa błędów

### 12.1. Błąd ładowania fiszek z API

**Scenariusz**: Request do `/api/flashcards` kończy się błędem (network error, 500, etc.)

**Obsługa**:
1. Hook `useStudySession` wyłapuje błąd w try-catch
2. Ustawienie `error` state z komunikatem
3. Przejście do `empty` state
4. Wyświetlenie error toast:
   ```tsx
   toast.error('Nie udało się załadować fiszek', {
     description: error.message,
     action: {
       label: 'Spróbuj ponownie',
       onClick: () => initializeSession()
     }
   });
   ```
5. Wyświetlenie `EmptyState` z komunikatem błędu i przyciskiem retry

**Graceful degradation**: User może wyjść do dashboard lub spróbować ponownie

### 12.2. Błąd zapisu do localStorage

**Scenariusz**: localStorage pełny, disabled, lub błąd permission

**Obsługa**:
1. `studyProgressStorage.save()` wyłapuje błąd
2. Log error do console
3. Kontynuacja sesji BEZ zapisywania postępu
4. Wyświetlenie warning toast:
   ```tsx
   toast.warning('Nie można zapisać postępu', {
     description: 'Twój postęp nie zostanie zachowany po zamknięciu przeglądarki.'
   });
   ```
5. Sesja działa normalnie (in-memory state)

**Wpływ**: User może kontynuować naukę, ale postęp nie będzie persisted

### 12.3. Corrupted localStorage data

**Scenariusz**: JSON parse error lub invalid schema w localStorage

**Obsługa**:
1. `studyProgressStorage.load()` wyłapuje błąd
2. Log warning do console
3. Silent reset do pustego storage
4. User zaczyna SM-2 od nowa (wszystkie karty jako nowe)
5. Brak error message (nie niepokoimy usera)

**Wpływ**: User traci historię powtórek, ale może kontynuować naukę

### 12.4. Brak fiszek do nauki

**Scenariusz**: User nie ma żadnych fiszek w bazie

**Obsługa**:
1. Po załadowaniu API sprawdzenie `flashcards.length === 0`
2. Ustawienie `sessionState = 'empty'`
3. Renderowanie `EmptyState` z CTA:
   - Ikona + nagłówek
   - Opis sytuacji
   - Przyciski: "Dodaj fiszkę" + "Generuj fiszki"

**Wpływ**: User jest kierowany do tworzenia/generowania fiszek

### 12.5. Keyboard event conflicts

**Scenariusz**: User przypadkowo naciska shortcut gdy nie powinien (np. Spacja w niewłaściwym momencie)

**Obsługa**:
1. W `useKeyboardShortcuts` sprawdzanie warunków:
   ```typescript
   // Ignoruj gdy focus w input
   if (event.target instanceof HTMLInputElement) return;
   
   // Flip tylko gdy !isFlipped
   if (event.key === ' ' && !isFlipped) {
     onFlip();
   }
   ```
2. `preventDefault()` tylko dla handled keys
3. Inne keys propagują normalnie

**Wpływ**: Shortcuts działają tylko gdy kontekstowo odpowiednie

### 12.6. Network timeout podczas ładowania

**Scenariusz**: API response trwa bardzo długo (> 30s)

**Obsługa**:
1. Dodanie timeout do fetch w API client:
   ```typescript
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 30000);
   
   try {
     const response = await fetch(url, { signal: controller.signal });
     clearTimeout(timeoutId);
     return response;
   } catch (err) {
     if (err.name === 'AbortError') {
       throw new Error('Request timeout - sprawdź połączenie z internetem');
     }
     throw err;
   }
   ```
2. Wyświetlenie error toast z retry button

**Wpływ**: User ma feedback o problemie i może spróbować ponownie

## 13. Dostępność (Accessibility)

### 13.1. Semantic HTML

**Wymagania**:
- `<main>` dla głównego contentu sesji
- `<article>` dla StudyCard
- `<button>` dla wszystkich interaktywnych elementów
- `<progress>` dla progress bar (lub ARIA role="progressbar")
- Proper heading hierarchy: h1 dla empty state, h2 dla stats

**Implementacja**:
```tsx
<main role="main" aria-label="Sesja nauki">
  <article aria-label="Fiszka do nauki">
    {/* card content */}
  </article>
</main>
```

### 13.2. ARIA attributes

**Wymagania**:
- `aria-live="polite"` dla progress updates (screen reader announcements)
- `aria-label` dla przycisków z ikonami
- `aria-disabled` dla disabled rating buttons
- `aria-current="true"` dla aktualnej karty w kolejce
- `role="status"` dla completion message

**Implementacja**:
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  Fiszka {currentIndex + 1} z {totalCards}
</div>

<button 
  aria-label="Ocena: Again - nie pamiętam" 
  aria-disabled={!isFlipped}
  disabled={!isFlipped}
>
  Again (1)
</button>
```

### 13.3. Keyboard navigation

**Wymagania**:
- Wszystkie interakcje dostępne z klawiatury
- Logiczny tab order
- Focus visible styles
- Escape do wyjścia
- Spacja/Enter dla akcji

**Implementacja**:
- Custom hook `useKeyboardShortcuts` obsługuje wszystko
- Focus styles w Tailwind: `focus:ring-2 focus:ring-offset-2`
- Tab order: header exit button → flip button → rating buttons (gdy visible)

### 13.4. Screen reader support

**Wymagania**:
- Opisowe labels dla wszystkich controls
- Live regions dla dynamic updates
- Skip links (opcjonalnie)
- Announcements po ważnych akcjach

**Implementacja**:
```tsx
{/* Screen reader announcement po flip */}
{isFlipped && (
  <div className="sr-only" aria-live="polite">
    Odpowiedź: {flashcard.back}
  </div>
)}

{/* Screen reader announcement po rating */}
<div className="sr-only" aria-live="polite" aria-atomic="true">
  {lastRating && `Fiszka oceniona jako ${lastRating}. Następna fiszka.`}
</div>
```

### 13.5. Reduced motion support

**Wymagania**:
- Respektowanie `prefers-reduced-motion`
- Brak animacji lub uproszczone dla users z motion sensitivity

**Implementacja**:
```css
@media (prefers-reduced-motion: reduce) {
  .study-card {
    transition: none !important;
    animation: none !important;
  }
}
```

## 14. Kroki implementacji

### Krok 1: Przygotowanie typów i algorytmu SM-2

**1.1. Dodać typy do `src/types.ts`**
- Dodać sekcję "STUDY SESSION VIEW MODELS" z wszystkimi typami z sekcji 5.1
- `SM2Quality`, `SM2ReviewData`, `FlashcardWithProgress`, `StudySessionState`, `SessionStats`
- Wszystkie Props types dla komponentów

**1.2. Utworzyć algorytm SM-2**
- Utworzyć plik `src/lib/algorithms/sm2.ts`
- Zaimplementować klasę `SM2Algorithm` z metodami:
  - `initializeCard()` - tworzenie nowych review data
  - `review()` - główna logika algorytmu
  - `isDue()` - sprawdzanie czy fiszka gotowa do review
  - `sortByPriority()` - sortowanie kart
- Dodać testy jednostkowe (opcjonalnie)

**1.3. Utworzyć localStorage service**
- Utworzyć plik `src/lib/storage/studyProgressStorage.ts`
- Zaimplementować `StudyProgressStorageService`:
  - `load()` - ładowanie z localStorage
  - `save()` - zapisywanie do localStorage
  - `updateCard()` - update pojedynczej karty
  - `getCard()` - pobierz dane karty
  - `clear()` - wyczyść storage
- Obsługa błędów i validation

### Krok 2: Utworzenie custom hooks

**2.1. useStudySession hook**
- Utworzyć plik `src/lib/hooks/useStudySession.ts`
- Implementacja głównej logiki sesji:
  - State management (sessionState, cardsQueue, currentIndex)
  - `initializeSession()` - ładowanie i setup
  - `flipCard()` - flip aktualnej karty
  - `rateCard()` - ocena i przejście dalej
  - `exitSession()` - zakończenie
  - `restartSession()` - restart
- Integracja z API (fetchFlashcards)
- Integracja z localStorage
- Integracja z SM-2 algorithm

**2.2. useKeyboardShortcuts hook**
- Utworzyć plik `src/lib/hooks/useKeyboardShortcuts.ts`
- Obsługa keyboard events:
  - Spacja → flip
  - 1-4 → rate
  - Escape → exit
- Warunki aktywacji (isActive, isFlipped)
- Cleanup event listeners

**2.3. Update index exports**
- Dodać do `src/lib/hooks/index.ts`:
  ```typescript
  export { useStudySession } from './useStudySession';
  export { useKeyboardShortcuts } from './useKeyboardShortcuts';
  ```

### Krok 3: Utworzenie komponentów prezentacyjnych (bottom-up)

**3.1. StudyProgressBar**
- Utworzyć `src/components/study/StudyProgressBar.tsx`
- Progress bar (shadcn/ui Progress)
- Tekst "Fiszka X z Y"
- Procent calculation

**3.2. StudySessionHeader**
- Utworzyć `src/components/study/StudySessionHeader.tsx`
- Fixed header z progress bar
- Stats (remaining, reviewed)
- Exit button z confirmation

**3.3. StudyCard**
- Utworzyć `src/components/study/StudyCard.tsx`
- Centralna duża karta
- Front/Back conditional rendering
- Flip animation (CSS 3D transform)
- Responsive font sizing
- Sanityzacja content

**3.4. FlipButton**
- Utworzyć `src/components/study/FlipButton.tsx`
- Duży wyraźny przycisk
- Keyboard hint (Spacja)
- Pulse animation

**3.5. StudyControls**
- Utworzyć `src/components/study/StudyControls.tsx`
- Grid z 4 rating buttons:
  - Again (red, X icon, key 1)
  - Hard (orange, AlertCircle icon, key 2)
  - Good (green, Check icon, key 3)
  - Easy (blue, Star icon, key 4)
- Disabled state handling
- Keyboard hints na każdym przycisku
- Responsive layout

**3.6. LoadingState**
- Utworzyć `src/components/study/LoadingState.tsx`
- Skeleton card
- Loading spinner
- "Przygotowuję sesję nauki..."

**3.7. EmptyState**
- Utworzyć `src/components/study/EmptyState.tsx`
- Ikona + tekst
- CTA buttons: "Dodaj fiszkę", "Generuj fiszki"
- Links do `/flashcards` i `/generate`

**3.8. CompletedState**
- Utworzyć `src/components/study/CompletedState.tsx`
- Gratulacje header
- Statystyki sesji (total reviewed, duration, breakdown)
- Buttons: "Powrót do panelu", "Rozpocznij nową sesję"
- Countdown timer do auto-redirect (10s)

### Krok 4: Utworzenie głównego widoku

**4.1. StudySessionView (Active Session)**
- Utworzyć `src/components/study/ActiveSession.tsx` (podkomponent)
- Layout z StudyCard + FlipButton/StudyControls
- Conditional rendering based on isFlipped

**4.2. StudySessionView (Main)**
- Utworzyć `src/components/study/StudySessionView.tsx`
- Integracja z hookami:
  - `useStudySession()`
  - `useKeyboardShortcuts()`
- Conditional rendering:
  - LoadingState
  - EmptyState
  - ActiveSession
  - CompletedState
- Error handling z toast notifications

**4.3. Index exports**
- Utworzyć `src/components/study/index.ts`:
  ```typescript
  export { StudySessionView } from './StudySessionView';
  export { StudySessionHeader } from './StudySessionHeader';
  export { StudyCard } from './StudyCard';
  export { StudyControls } from './StudyControls';
  // ... etc
  ```

### Krok 5: Utworzenie Astro page

**5.1. Study page**
- Utworzyć `src/pages/study.astro`
- Layout bez głównej nawigacji (fullscreen mode)
  - Opcja 1: Nowy MinimalLayout bez header/sidebar
  - Opcja 2: Conditional rendering w istniejącym Layout
- Renderowanie `StudySessionView` jako client component
- Metadata: title, description

**Przykład**:
```astro
---
import MinimalLayout from '@/layouts/MinimalLayout.astro';
import { StudySessionView } from '@/components/study';
---

<MinimalLayout title="Sesja nauki - 10x Cards">
  <StudySessionView client:only="react" />
</MinimalLayout>
```

### Krok 6: Styling i animacje

**6.1. Flip animation dla StudyCard**
- CSS 3D transforms lub smooth fade
- Respektowanie `prefers-reduced-motion`
- Smooth timing function

**6.2. Transition animations**
- Fade in dla nowej karty
- Slide animation dla rating buttons (opcjonalnie)
- Progress bar smooth updates

**6.3. Responsive design**
- Mobile: card zajmuje większość ekranu
- Desktop: większe paddingi, centered layout
- Rating buttons: 4 kolumny desktop, 2×2 grid mobile

**6.4. Focus states i hover effects**
- Wyraźne focus rings (Tailwind: `focus-visible:ring-2`)
- Hover effects na przyciskach
- Active states

### Krok 7: Integracja z nawigacją

**7.1. Dodać link w Dashboard**
- Update `src/components/dashboard/MenuGrid.tsx`
- Dodać kafelek "Sesja nauki":
  - Ikona: `GraduationCap` lub `BookOpen` (lucide-react)
  - Tytuł: "Sesja nauki"
  - Opis: "Ucz się swoich fiszek"
  - Link: `/study`
  - Variant: może być primary (highlight)

**7.2. Nawigacja powrotna**
- Exit button w StudySessionHeader → `/dashboard`
- CompletedState buttons → `/dashboard`
- Breadcrumbs (opcjonalnie)

### Krok 8: Obsługa błędów i edge cases

**8.1. Error boundaries**
- Dodać React Error Boundary dla StudySessionView (opcjonalnie)
- Fallback UI przy crash

**8.2. Toast notifications**
- Integracja z ToasterProvider
- Error toasts dla API failures
- Warning toast dla localStorage issues
- Success toast po completed session (opcjonalnie)

**8.3. Confirmation dialogs**
- Exit confirmation gdy sesja w trakcie
- Użycie shadcn/ui AlertDialog

**8.4. Edge cases testing**
- Brak fiszek
- 1 fiszka (edge case dla next/prev)
- Bardzo długie teksty w fiszkach
- Corrupted localStorage
- Network offline
- Multiple rapid key presses

### Krok 9: Dostępność (a11y)

**9.1. Semantic HTML**
- `<main>` dla contentu
- `<article>` dla StudyCard
- `<button>` dla wszystkich controls
- Proper headings

**9.2. ARIA attributes**
- `aria-live` dla progress updates
- `aria-label` dla icon buttons
- `aria-disabled` dla disabled states
- `role="status"` dla announcements

**9.3. Screen reader testing**
- Testy z NVDA/JAWS (Windows) lub VoiceOver (Mac)
- Live region announcements
- Opisowe labels

**9.4. Keyboard testing**
- Kompletna nawigacja bez myszy
- Tab order
- Focus trap w dialogs
- All shortcuts working

### Krok 10: Testowanie

**10.1. Manual testing**
- Pełny flow: dashboard → study → rate cards → complete → dashboard
- Wszystkie keyboard shortcuts (Spacja, 1-4, Escape)
- Exit z confirmation
- Restart sesji
- Empty state flow
- Error scenarios

**10.2. Cross-browser testing**
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Android)

**10.3. Responsive testing**
- Mobile (320px, 375px, 414px)
- Tablet (768px, 1024px)
- Desktop (1280px, 1920px)

**10.4. Performance testing**
- Sprawdzenie performance z 100 fiszkami
- Smooth animations (60fps)
- localStorage save speed

**10.5. Accessibility audit**
- Lighthouse accessibility score
- axe DevTools scan
- Manual keyboard testing
- Screen reader testing

### Krok 11: localStorage persistence testing

**11.1. Podstawowe scenariusze**
- Ocena fiszek → refresh page → sprawdź czy SM-2 data zachowane
- Wypełnienie całej sesji → restart → sprawdź intervals
- Clear browser data → graceful reset

**11.2. Edge cases**
- localStorage full (quota exceeded)
- localStorage disabled
- Corrupted JSON
- Schema version mismatch

### Krok 12: Optymalizacja i polish

**12.1. Performance optimizations**
- React.memo dla StudyCard (zapobiega re-render podczas stats update)
- useMemo dla sorted cards
- useCallback dla event handlers
- Lazy loading animations (opcjonalnie)

**12.2. UX improvements**
- Smooth scroll do top przy card transition
- Preload następnej karty (opcjonalnie)
- Haptic feedback na mobile (opcjonalnie)
- Sound effects (opcjonalnie, z mute toggle)

**12.3. Code quality**
- Linter fixes
- TypeScript strict mode compliance
- JSDoc comments
- Code review

**12.4. Documentation**
- README dla komponentów study
- Instrukcja użycia algorytmu SM-2
- Komentarze w kodzie

### Krok 13: Finalizacja i deployment

**13.1. Final checks**
- Wszystkie TODOs resolved
- No console errors/warnings
- Build succeeds
- Type checking passes
- Linter passes

**13.2. User testing**
- Beta test z kilkoma userami
- Zbieranie feedbacku
- Iteracja na podstawie feedbacku

**13.3. Monitoring setup**
- Analytics events (session started, completed, cards reviewed)
- Error tracking (Sentry lub podobne)
- Performance monitoring

---

## 15. Podsumowanie

Plan implementacji widoku Sesji Nauki obejmuje:

**Komponenty**:
- **1 strona Astro**: `/study`
- **9 komponentów React**: StudySessionView, StudySessionHeader, StudyProgressBar, StudyCard, FlipButton, StudyControls, LoadingState, EmptyState, CompletedState
- **1 helper component**: ActiveSession (podkomponent)

**Logika biznesowa**:
- **2 custom hooki**: useStudySession, useKeyboardShortcuts
- **1 algorytm**: SM-2 implementation
- **1 storage service**: studyProgressStorage (localStorage)

**Typy**:
- **11+ nowych typów**: SM2Quality, SM2ReviewData, FlashcardWithProgress, StudySessionState, SessionStats, + wszystkie Props types

**Funkcjonalności**:
- Pełnoekranowy distraction-free mode
- Algorytm SM-2 dla spaced repetition
- 4 poziomy oceny (Again, Hard, Good, Easy)
- Keyboard shortcuts (Spacja, 1-4, Escape)
- Progress tracking i statystyki
- localStorage persistence (MVP)
- Full accessibility support
- Smooth animations i transitions

**Szacowany czas implementacji**: 3-4 dni robocze dla doświadczonego frontend developera, włączając testowanie, optymalizację i polish.

**Priorytet funkcji dla MVP**:
1. ✅ Core study flow (flip, rate, next)
2. ✅ SM-2 algorithm (uproszczony)
3. ✅ localStorage persistence
4. ✅ Keyboard shortcuts
5. ✅ Basic stats i progress
6. 🔄 Advanced animations (nice-to-have)
7. 🔄 Sound effects (future enhancement)
8. 🔄 Backend sync (post-MVP)

