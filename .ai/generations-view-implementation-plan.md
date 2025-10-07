# Plan implementacji widoku Historii Generacji

## 1. Przegląd

Widok Historii Generacji (`/generations`) umożliwia użytkownikom przeglądanie wszystkich wykonanych generacji fiszek AI wraz z ich szczegółowymi statystykami. Głównym celem widoku jest:
- Prezentacja historii wszystkich generacji w formie tabelarycznej z paginacją
- Wyświetlanie kluczowych metryk: liczba wygenerowanych fiszek, liczba zaakceptowanych (z podziałem na edytowane/nieedytowane), wskaźnik akceptacji
- Umożliwienie nawigacji do szczegółowego widoku pojedynczej generacji
- Monitorowanie efektywności generowania fiszek AI (kluczowe dla mierzenia sukcesu produktu - cel 75% akceptacji)

Widok składa się z dwóch głównych stron:
1. **Lista generacji** (`/generations`) - tabela z paginacją
2. **Szczegóły generacji** (`/generations/[id]`) - pełne informacje o konkretnej generacji wraz z powiązanymi fiszkami

## 2. Routing widoku

### Główna lista generacji
- **Ścieżka**: `/generations`
- **Plik**: `src/pages/generations.astro`
- **Typ**: Chroniony widok (wymaga uwierzytelnienia w przyszłości)
- **Query params**: `?page={number}` - numer strony paginacji (domyślnie 1)

### Szczegóły generacji
- **Ścieżka**: `/generations/[id]`
- **Plik**: `src/pages/generations/[id].astro`
- **Typ**: Chroniony widok
- **Params**: `id` - identyfikator generacji (number)

## 3. Struktura komponentów

### Hierarchia komponentów dla listy generacji

```
generations.astro (Astro page)
└── Layout (Astro)
    └── GenerationsView (React)
        ├── Header Section
        │   └── PageTitle + Description
        ├── Content Section (conditional rendering)
        │   ├── GenerationsListSkeleton (when isLoading)
        │   ├── GenerationsEmptyState (when empty)
        │   └── GenerationList (when data loaded)
        │       ├── Table (shadcn/ui)
        │       │   ├── TableHeader
        │       │   └── TableBody
        │       │       └── GenerationRow (multiple)
        │       │           ├── DateCell
        │       │           ├── TextLengthCell
        │       │           ├── GeneratedCountCell
        │       │           ├── AcceptedCountsCell
        │       │           ├── AcceptanceRateCell
        │       │           │   └── AcceptanceRateIndicator
        │       │           └── ActionsCell
        └── Pagination (reused from flashcards)
```

### Hierarchia komponentów dla szczegółów generacji

```
[id].astro (Astro page)
└── Layout (Astro)
    └── GenerationDetailView (React)
        ├── BackButton
        ├── DetailSkeleton (when isLoading)
        └── DetailContent (when loaded)
            ├── GenerationDetailHeader
            ├── GenerationStatsGrid
            │   └── StatCard (multiple)
            ├── SourceTextSection
            │   └── CollapsibleText
            └── AssociatedFlashcardsSection
                ├── SectionHeader
                └── FlashcardList
                    └── FlashcardItem (multiple)
```

## 4. Szczegóły komponentów

### 4.1. GenerationsView (React)

**Opis**: Główny kontener widoku listy generacji. Odpowiada za zarządzanie stanem, pobieranie danych z API, obsługę paginacji oraz warunkowe renderowanie odpowiednich podkomponentów (loading, empty, list).

**Główne elementy**:
- Sekcja nagłówka z tytułem "Historia generacji" i opisem
- Kontener główny z conditional rendering:
  - `GenerationsListSkeleton` podczas ładowania
  - `GenerationsEmptyState` gdy brak danych
  - `GenerationList` + `Pagination` gdy dane załadowane
- Obsługa błędów przez toast notifications (ToasterProvider)

**Obsługiwane interakcje**:
- Inicjalne załadowanie danych na podstawie query param `?page=`
- Zmiana strony paginacji
- Nawigacja do szczegółów generacji
- Retry po błędzie

**Obsługiwana walidacja**:
- Walidacja numeru strony (musi być >= 1)
- Obsługa pustej listy (empty state)
- Obsługa błędów API (400, 500, 503)

**Typy**:
- `GenerationsViewProps` (props)
- `GenerationDTO` (dane z API)
- `PaginationMeta` (metadane paginacji)
- `ErrorState` (stan błędu)

**Propsy**:
```typescript
type GenerationsViewProps = {
  initialPage?: number; // z query params, domyślnie 1
};
```

### 4.2. GenerationList (React)

**Opis**: Komponent renderujący responsywną tabelę z listą generacji. Wykorzystuje komponenty `Table` z shadcn/ui do zachowania spójności z design systemem.

**Główne elementy**:
- `<Table>` (shadcn/ui)
  - `<TableHeader>` z kolumnami:
    - Data utworzenia
    - Długość tekstu
    - Wygenerowano
    - Zaakceptowano (unedited/edited)
    - Wskaźnik akceptacji
    - Akcje
  - `<TableBody>` z wieloma `<GenerationRow>`

**Obsługiwane interakcje**:
- Przekazywanie kliknięcia wiersza do parent (navigation)
- Hover effects na wierszach

**Obsługiwana walidacja**:
- Brak - komponent prezentacyjny

**Typy**:
- `GenerationListProps` (props)
- `GenerationDTO[]` (lista danych)

**Propsy**:
```typescript
type GenerationListProps = {
  generations: GenerationDTO[];
  onRowClick: (id: number) => void;
};
```

### 4.3. GenerationRow (React)

**Opis**: Pojedynczy wiersz tabeli reprezentujący jedną generację. Zawiera sformatowane dane i jest klikalny (nawigacja do szczegółów).

**Główne elementy**:
- `<TableRow>` z klasami hover i cursor-pointer
- `<TableCell>` dla każdej kolumny:
  - Data (sformatowana z `formatDistanceToNow` lub `format`)
  - Długość tekstu (liczba znaków z jednostką)
  - Liczba wygenerowanych fiszek
  - Zaakceptowane (format: "X bez edycji / Y z edycją")
  - `<AcceptanceRateIndicator>` z progress bar
  - Link/Button "Zobacz szczegóły"

**Obsługiwane interakcje**:
- onClick na całym wierszu → wywołanie `onRowClick(generation.id)`
- onClick na przycisku "Zobacz szczegóły" → nawigacja

**Obsługiwana walidacja**:
- Obsługa null values dla `accepted_unedited_count` i `accepted_edited_count`
- Formatowanie daty z locale PL

**Typy**:
- `GenerationRowProps` (props)
- `GenerationDTO` (dane pojedynczej generacji)

**Propsy**:
```typescript
type GenerationRowProps = {
  generation: GenerationDTO;
  onRowClick: (id: number) => void;
};
```

### 4.4. AcceptanceRateIndicator (React)

**Opis**: Komponent wizualizujący wskaźnik akceptacji fiszek w formie progress bar z procentem i tooltipem. Kolor progress bar zależy od wartości (czerwony < 50%, żółty 50-74%, zielony >= 75%).

**Główne elementy**:
- Kontener z progress bar (shadcn/ui Progress lub custom)
- Tekst z procentem
- Tooltip (shadcn/ui Tooltip) z szczegółami:
  - "X z Y fiszek zaakceptowano (Z%)"
  - "Bez edycji: X"
  - "Z edycją: Y"

**Obsługiwane interakcje**:
- Hover → pokazanie tooltipa z detalami

**Obsługiwana walidacja**:
- Obsługa przypadku gdy `accepted_unedited_count` i `accepted_edited_count` są null (nowo utworzona generacja bez zaakceptowanych fiszek)
- Obliczenie procentu: `((unedited + edited) / generated_count) * 100`
- Jeśli null → wyświetlenie "0%" lub "—" (dash)

**Typy**:
- `AcceptanceRateIndicatorProps` (props)
- `AcceptanceRateViewModel` (wyliczone wartości)

**Propsy**:
```typescript
type AcceptanceRateIndicatorProps = {
  generatedCount: number;
  acceptedUnedited: number | null;
  acceptedEdited: number | null;
};
```

### 4.5. GenerationsListSkeleton (React)

**Opis**: Skeleton UI wyświetlany podczas ładowania listy generacji. Symuluje strukturę tabeli z 5 wierszami.

**Główne elementy**:
- `<Table>` z `<TableHeader>` (normalne nagłówki)
- `<TableBody>` z 5 x `<TableRow>` zawierającymi `<Skeleton>` (shadcn/ui)

**Obsługiwane interakcje**: Brak (statyczny loading state)

**Obsługiwana walidacja**: Brak

**Typy**: Brak propsów

**Propsy**: Brak

### 4.6. GenerationsEmptyState (React)

**Opis**: Komponent wyświetlany gdy użytkownik nie ma jeszcze żadnych generacji. Zawiera ilustrację/ikonę, tekst zachęcający i CTA do rozpoczęcia generowania.

**Główne elementy**:
- Kontener wycentrowany (podobny do EmptyState w flashcards)
- Ikona (np. Sparkles lub FileText z lucide-react)
- Tytuł: "Brak historii generacji"
- Opis: "Nie masz jeszcze żadnych generacji. Zacznij od wygenerowania fiszek!"
- Button (shadcn/ui) "Generuj fiszki" → link do `/generate`

**Obsługiwane interakcje**:
- Kliknięcie przycisku → nawigacja do `/generate`

**Obsługiwana walidacja**: Brak

**Typy**: Brak propsów

**Propsy**: Brak

### 4.7. GenerationDetailView (React)

**Opis**: Główny kontener widoku szczegółów pojedynczej generacji. Pobiera dane z API i wyświetla wszystkie informacje o generacji oraz powiązane fiszki.

**Główne elementy**:
- BackButton (nawigacja do `/generations`)
- Conditional rendering:
  - `DetailSkeleton` podczas ładowania
  - Error state jeśli 404 lub inny błąd
  - `DetailContent` gdy dane załadowane

**Obsługiwane interakcje**:
- Załadowanie danych na podstawie `id` z URL
- Nawigacja powrotna do listy
- Retry po błędzie

**Obsługiwana walidacja**:
- Walidacja `id` (musi być liczbą > 0)
- Obsługa 404 (generacja nie istnieje)
- Obsługa błędów API

**Typy**:
- `GenerationDetailViewProps` (props)
- `GenerationDetailDTO` (dane z API)
- `ErrorState` (stan błędu)

**Propsy**:
```typescript
type GenerationDetailViewProps = {
  generationId: number; // z URL params
};
```

### 4.8. GenerationDetailHeader (React)

**Opis**: Nagłówek widoku szczegółów z tytułem, datą utworzenia i podstawowymi informacjami.

**Główne elementy**:
- Tytuł: "Generacja #[ID]"
- Badge z datą utworzenia
- Opis: "Szczegóły generacji z [data]"

**Obsługiwane interakcje**: Brak

**Obsługiwana walidacja**: Formatowanie daty z locale PL

**Typy**:
- `GenerationDetailHeaderProps` (props)

**Propsy**:
```typescript
type GenerationDetailHeaderProps = {
  generation: GenerationDetailDTO;
};
```

### 4.9. GenerationStatsGrid (React)

**Opis**: Grid z kartami statystyk generacji (podobny do StatsGrid w dashboardzie).

**Główne elementy**:
- Grid 2x2 lub 3x2 z `StatCard`:
  - Wygenerowano fiszek
  - Zaakceptowano bez edycji
  - Zaakceptowano z edycją
  - Wskaźnik akceptacji (%)
  - Długość tekstu źródłowego
  - Czas generowania (ms)

**Obsługiwane interakcje**: Brak

**Obsługiwana walidacja**: 
- Formatowanie czasu (ms → s jeśli > 1000)
- Obsługa null dla accepted counts

**Typy**:
- `GenerationStatsGridProps` (props)
- `GenerationDetailDTO` (dane)

**Propsy**:
```typescript
type GenerationStatsGridProps = {
  generation: GenerationDetailDTO;
};
```

### 4.10. SourceTextSection (React)

**Opis**: Sekcja z tekstem źródłowym użytym do generacji. Tekst może być długi (1000-10000 znaków), więc potrzebny collapse/expand.

**Główne elementy**:
- Nagłówek sekcji: "Tekst źródłowy"
- `CollapsibleText` lub `Accordion` (shadcn/ui)
  - Collapsed: pierwsze 200 znaków + "..."
  - Expanded: pełny tekst
- Przycisk "Pokaż więcej" / "Pokaż mniej"

**Obsługiwane interakcje**:
- Toggle collapsed/expanded state

**Obsługiwana walidacja**: 
- Sprawdzenie czy tekst jest dłuższy niż 200 znaków (jeśli nie, nie pokazuj przycisku)

**Typy**:
- `SourceTextSectionProps` (props)

**Propsy**:
```typescript
type SourceTextSectionProps = {
  sourceTextHash: string; // Note: API nie zwraca source_text, tylko hash!
  sourceTextLength: number;
};
```

**UWAGA**: API prawdopodobnie nie zwraca pełnego `source_text` w response (tylko hash), więc możliwe że ta sekcja będzie pokazywać tylko hash i długość, albo trzeba będzie rozszerzyć API.

### 4.11. AssociatedFlashcardsSection (React)

**Opis**: Sekcja z listą fiszek powiązanych z generacją. Pokazuje które fiszki zostały zaakceptowane i czy były edytowane.

**Główne elementy**:
- Nagłówek: "Powiązane fiszki ([count])"
- Lista fiszek:
  - Każda fiszka jako karta z:
    - Front text
    - Back text (collapsed jeśli długi)
    - Badge ze statusem (AI - bez edycji / AI - edytowana)
    - Link do edycji fiszki w `/flashcards` (opcjonalnie)

**Obsługiwane interakcje**:
- Kliknięcie fiszki → nawigacja do `/flashcards?highlight={id}` (opcjonalnie)

**Obsługiwana walidacja**: 
- Empty state jeśli brak powiązanych fiszek (wszystkie odrzucone)

**Typy**:
- `AssociatedFlashcardsSectionProps` (props)
- `Pick<FlashcardDTO, 'id' | 'front' | 'back' | 'source'>[]` (lista fiszek)

**Propsy**:
```typescript
type AssociatedFlashcardsSectionProps = {
  flashcards: Pick<FlashcardDTO, 'id' | 'front' | 'back' | 'source'>[];
};
```

## 5. Typy

### 5.1. Istniejące typy z `src/types.ts`

Wykorzystywane bezpośrednio:
```typescript
// Entity z bazy danych (bez user_id)
type GenerationDTO = {
  id: number;
  generated_count: number;
  accepted_unedited_count: number | null;
  accepted_edited_count: number | null;
  source_text_hash: string;
  source_text_length: number;
  generation_duration: number; // ms
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
};

// Response z listy generacji
type GenerationListResponse = {
  data: GenerationDTO[];
  pagination: PaginationMeta;
};

// Szczegóły generacji z powiązanymi fiszkami
type GenerationDetailDTO = GenerationDTO & {
  flashcards: Pick<FlashcardDTO, 'id' | 'front' | 'back' | 'source'>[];
};

// Metadane paginacji
type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

// Stan błędu
type ErrorState = {
  message: string;
  code?: ApiErrorCode;
} | null;
```

### 5.2. Nowe typy ViewModel dla widoku generacji

Dodać do `src/types.ts`:

```typescript
// ============================================================================
// GENERATIONS VIEW MODELS (Frontend specific types)
// ============================================================================

/**
 * Props dla głównego widoku listy generacji
 */
export type GenerationsViewProps = {
  /** Początkowa strona z query params */
  initialPage?: number;
};

/**
 * Props dla komponentu GenerationList
 */
export type GenerationListProps = {
  /** Lista generacji do wyświetlenia */
  generations: GenerationDTO[];
  /** Callback wywoływany po kliknięciu wiersza */
  onRowClick: (id: number) => void;
};

/**
 * Props dla pojedynczego wiersza w tabeli generacji
 */
export type GenerationRowProps = {
  /** Dane pojedynczej generacji */
  generation: GenerationDTO;
  /** Callback wywoływany po kliknięciu wiersza */
  onRowClick: (id: number) => void;
};

/**
 * Props dla wskaźnika akceptacji fiszek
 */
export type AcceptanceRateIndicatorProps = {
  /** Liczba wygenerowanych fiszek */
  generatedCount: number;
  /** Liczba zaakceptowanych bez edycji (null jeśli brak) */
  acceptedUnedited: number | null;
  /** Liczba zaakceptowanych z edycją (null jeśli brak) */
  acceptedEdited: number | null;
};

/**
 * ViewModel dla wskaźnika akceptacji (wyliczone wartości)
 */
export type AcceptanceRateViewModel = {
  /** Procent akceptacji (0-100) */
  percentage: number;
  /** Liczba zaakceptowanych bez edycji */
  acceptedUnedited: number;
  /** Liczba zaakceptowanych z edycją */
  acceptedEdited: number;
  /** Całkowita liczba zaakceptowanych */
  totalAccepted: number;
  /** Wariant kolorystyczny dla UI */
  variant: 'low' | 'medium' | 'high'; // low: <50%, medium: 50-74%, high: >=75%
};

/**
 * Props dla widoku szczegółów generacji
 */
export type GenerationDetailViewProps = {
  /** ID generacji z URL params */
  generationId: number;
};

/**
 * Props dla nagłówka widoku szczegółów
 */
export type GenerationDetailHeaderProps = {
  /** Dane generacji */
  generation: GenerationDetailDTO;
};

/**
 * Props dla gridu statystyk generacji
 */
export type GenerationStatsGridProps = {
  /** Dane generacji */
  generation: GenerationDetailDTO;
};

/**
 * Props dla sekcji z tekstem źródłowym
 */
export type SourceTextSectionProps = {
  /** Hash tekstu źródłowego (SHA-256) */
  sourceTextHash: string;
  /** Długość tekstu źródłowego w znakach */
  sourceTextLength: number;
};

/**
 * Props dla sekcji z powiązanymi fiszkami
 */
export type AssociatedFlashcardsSectionProps = {
  /** Lista powiązanych fiszek */
  flashcards: Pick<FlashcardDTO, 'id' | 'front' | 'back' | 'source'>[];
};
```

### 5.3. Typy pomocnicze (utility functions)

Dodać w osobnym pliku `src/lib/viewModels/generationViewModels.ts`:

```typescript
import type { GenerationDTO, AcceptanceRateViewModel } from '@/types';

/**
 * Oblicza wskaźnik akceptacji fiszek i zwraca ViewModel
 */
export function calculateAcceptanceRate(generation: GenerationDTO): AcceptanceRateViewModel {
  const acceptedUnedited = generation.accepted_unedited_count ?? 0;
  const acceptedEdited = generation.accepted_edited_count ?? 0;
  const totalAccepted = acceptedUnedited + acceptedEdited;
  const percentage = generation.generated_count > 0
    ? Math.round((totalAccepted / generation.generated_count) * 100)
    : 0;

  let variant: 'low' | 'medium' | 'high';
  if (percentage < 50) {
    variant = 'low';
  } else if (percentage < 75) {
    variant = 'medium';
  } else {
    variant = 'high';
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
  return `${length.toLocaleString('pl-PL')} znaków`;
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
export function formatAcceptedCounts(
  unedited: number | null,
  edited: number | null
): string {
  const uneditedCount = unedited ?? 0;
  const editedCount = edited ?? 0;
  return `${uneditedCount} bez edycji / ${editedCount} z edycją`;
}
```

## 6. Zarządzanie stanem

### 6.1. Custom hook: useGenerationsList

**Lokalizacja**: `src/lib/hooks/useGenerationsList.ts`

**Cel**: Zarządzanie stanem listy generacji, paginacji, ładowania i błędów. Pobieranie danych z API i obsługa paginacji.

**Implementacja**:
```typescript
import { useState, useEffect } from 'react';
import type { GenerationDTO, PaginationMeta, ErrorState } from '@/types';
import { fetchGenerations } from '@/lib/api/generations';

export function useGenerationsList(initialPage: number = 1) {
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
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił błąd podczas ładowania generacji';
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
```

**Eksportowane wartości**:
- `generations: GenerationDTO[]` - lista generacji
- `pagination: PaginationMeta | null` - metadane paginacji
- `isLoading: boolean` - stan ładowania
- `error: ErrorState` - stan błędu
- `refetch: (page: number) => Promise<void>` - funkcja do ponownego załadowania danych

### 6.2. Custom hook: useGenerationDetail

**Lokalizacja**: `src/lib/hooks/useGenerationDetail.ts`

**Cel**: Zarządzanie stanem szczegółów pojedynczej generacji. Pobieranie danych z API na podstawie ID.

**Implementacja**:
```typescript
import { useState, useEffect } from 'react';
import type { GenerationDetailDTO, ErrorState } from '@/types';
import { fetchGenerationById } from '@/lib/api/generations';

export function useGenerationDetail(generationId: number) {
  const [generation, setGeneration] = useState<GenerationDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorState>(null);

  const loadGeneration = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchGenerationById(generationId);
      setGeneration(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił błąd podczas ładowania szczegółów generacji';
      const errorCode = err instanceof Error && 'code' in err ? (err as any).code : undefined;
      setError({ message: errorMessage, code: errorCode });
      setGeneration(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (generationId > 0) {
      loadGeneration();
    } else {
      setError({ message: 'Nieprawidłowe ID generacji' });
      setIsLoading(false);
    }
  }, [generationId]);

  return {
    generation,
    isLoading,
    error,
    refetch: loadGeneration,
  };
}
```

**Eksportowane wartości**:
- `generation: GenerationDetailDTO | null` - dane generacji ze szczegółami
- `isLoading: boolean` - stan ładowania
- `error: ErrorState` - stan błędu
- `refetch: () => Promise<void>` - funkcja do ponownego załadowania

### 6.3. Stan lokalny w komponentach

**SourceTextSection**:
- `isExpanded: boolean` - czy tekst źródłowy jest rozwinięty

**GenerationsView**:
- Wykorzystuje hook `useGenerationsList`
- Zarządza query params przez `useSearchParams` (React Router) lub `URLSearchParams`

**GenerationDetailView**:
- Wykorzystuje hook `useGenerationDetail`

## 7. Integracja API

### 7.1. API Client - nowy plik `src/lib/api/generations.ts`

**Lokalizacja**: `src/lib/api/generations.ts`

**Cel**: Centralizacja wywołań API dla zasobu generations. Zapewnia type-safe funkcje do komunikacji z backendem.

**Implementacja**:
```typescript
import type { 
  GenerationListQuery, 
  GenerationListResponse, 
  GenerationDetailDTO,
  ApiError 
} from '@/types';

const API_BASE_URL = '/api';

/**
 * Pobiera listę generacji z paginacją
 * 
 * @param query - parametry zapytania (page, limit)
 * @returns Promise z listą generacji i metadanymi paginacji
 * @throws Error jeśli request się nie powiedzie
 */
export async function fetchGenerations(
  query: GenerationListQuery = {}
): Promise<GenerationListResponse> {
  const params = new URLSearchParams();
  
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());

  const url = `${API_BASE_URL}/generations?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message || 'Nie udało się pobrać listy generacji');
  }

  return response.json();
}

/**
 * Pobiera szczegóły pojedynczej generacji
 * 
 * @param id - identyfikator generacji
 * @returns Promise ze szczegółami generacji i powiązanymi fiszkami
 * @throws Error jeśli request się nie powiedzie lub generacja nie istnieje (404)
 */
export async function fetchGenerationById(id: number): Promise<GenerationDetailDTO> {
  const url = `${API_BASE_URL}/generations/${id}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw Object.assign(
        new Error('Generacja nie została znaleziona'),
        { code: 'NOT_FOUND' }
      );
    }
    
    const error: ApiError = await response.json();
    throw new Error(error.error.message || 'Nie udało się pobrać szczegółów generacji');
  }

  return response.json();
}
```

### 7.2. Typy żądań i odpowiedzi

**Lista generacji**:
- **Request**: `GET /api/generations?page={page}&limit=20`
  - Query params: `GenerationListQuery = { page?: number, limit?: number }`
  - Domyślne wartości: `page = 1, limit = 20`
- **Response**: `GenerationListResponse`
  ```typescript
  {
    data: GenerationDTO[];
    pagination: PaginationMeta;
  }
  ```

**Szczegóły generacji**:
- **Request**: `GET /api/generations/{id}`
  - Path param: `id: number`
- **Response**: `GenerationDetailDTO`
  ```typescript
  {
    id: number;
    generated_count: number;
    accepted_unedited_count: number | null;
    accepted_edited_count: number | null;
    source_text_hash: string;
    source_text_length: number;
    generation_duration: number;
    created_at: string;
    updated_at: string;
    flashcards: Array<{
      id: number;
      front: string;
      back: string;
      source: FlashcardSource;
    }>;
  }
  ```

### 7.3. Obsługa błędów API

**Możliwe błędy**:
- **400 Bad Request**: Nieprawidłowe query params (np. page < 1)
  - Akcja: Wyświetlenie komunikatu błędu w toast
- **404 Not Found**: Generacja nie istnieje (tylko dla szczegółów)
  - Akcja: Przekierowanie do `/generations` z komunikatem w toast
- **500 Internal Server Error**: Błąd serwera
  - Akcja: Wyświetlenie komunikatu z możliwością retry
- **503 Service Unavailable**: Serwis tymczasowo niedostępny
  - Akcja: Wyświetlenie komunikatu z możliwością retry

## 8. Interakcje użytkownika

### 8.1. Zmiana strony paginacji

**Trigger**: Użytkownik klika przycisk "Następna", "Poprzednia" lub konkretny numer strony

**Flow**:
1. Użytkownik klika przycisk paginacji
2. Komponent `Pagination` wywołuje callback `onPageChange(newPage)`
3. `GenerationsView` wywołuje `refetch(newPage)`
4. Hook `useGenerationsList` ustawia `isLoading = true`
5. Wykonanie request GET `/api/generations?page={newPage}&limit=20`
6. Po otrzymaniu response:
   - Update `generations` i `pagination`
   - Update URL query params `?page={newPage}` (przez `history.pushState` lub router)
   - Ustawienie `isLoading = false`
7. Re-render `GenerationList` z nowymi danymi

**Walidacja**:
- Nie można przejść do strony < 1
- Nie można przejść do strony > `total_pages`
- Przyciski "Poprzednia" i "Następna" są disabled gdy na odpowiednich krawędziach

### 8.2. Kliknięcie wiersza tabeli

**Trigger**: Użytkownik klika na wiersz w tabeli generacji

**Flow**:
1. Użytkownik klika na `<TableRow>` (poza przyciskiem "Zobacz szczegóły")
2. Event handler `onClick` w `GenerationRow` wywołuje `onRowClick(generation.id)`
3. `GenerationsView` wykonuje nawigację do `/generations/{id}`
4. Przeglądarka ładuje nową stronę (Astro page)
5. Renderowanie `GenerationDetailView` z odpowiednim `generationId`

**Walidacja**: Brak (zawsze prawidłowe ID z bazy danych)

### 8.3. Kliknięcie przycisku "Zobacz szczegóły"

**Trigger**: Użytkownik klika przycisk/link "Zobacz szczegóły" w kolumnie akcji

**Flow**:
1. Użytkownik klika `<Link>` lub `<Button>` w kolumnie akcji
2. Nawigacja do `/generations/{id}`
3. Dalszy flow jak w 8.2 (punkt 4-5)

**Walidacja**: Brak

### 8.4. Rozwinięcie/zwinięcie tekstu źródłowego (widok szczegółów)

**Trigger**: Użytkownik klika przycisk "Pokaż więcej" / "Pokaż mniej"

**Flow**:
1. Użytkownik klika przycisk toggle
2. Stan `isExpanded` zmienia się (toggle)
3. Re-render komponentu:
   - Jeśli `isExpanded = true`: pokazanie pełnego tekstu (uwaga: API może nie zwracać pełnego tekstu!)
   - Jeśli `isExpanded = false`: pokazanie tylko pierwszych 200 znaków + "..."
4. Zmiana tekstu przycisku

**Walidacja**:
- Przycisk jest widoczny tylko jeśli `sourceTextLength > 200`

**UWAGA**: API prawdopodobnie nie zwraca pełnego `source_text`, tylko `source_text_hash`. Możliwe że trzeba będzie:
- Zmodyfikować endpoint aby zwracał pełny tekst (opcjonalnie)
- Lub wyświetlać tylko hash i długość bez możliwości rozwinięcia

### 8.5. Powrót do listy generacji

**Trigger**: Użytkownik klika przycisk "Wróć" w widoku szczegółów

**Flow**:
1. Użytkownik klika `BackButton`
2. Nawigacja do `/generations` (lub `history.back()`)
3. Opcjonalnie: przywrócenie poprzedniego stanu paginacji (jeśli zapisany w query params)

**Walidacja**: Brak

### 8.6. Retry po błędzie

**Trigger**: Użytkownik klika przycisk "Spróbuj ponownie" po wystąpieniu błędu

**Flow**:
1. Wyświetlenie komunikatu błędu z przyciskiem "Spróbuj ponownie"
2. Użytkownik klika przycisk
3. Wywołanie `refetch()` (z hooka)
4. Powtórzenie requestu
5. Obsługa response/error jak wcześniej

**Walidacja**: Brak

## 9. Warunki i walidacja

### 9.1. Walidacja query params (lista generacji)

**Komponenty**: `GenerationsView`, hook `useGenerationsList`

**Warunki**:
- `page` musi być liczbą >= 1
- `limit` jest hardcoded na 20 (zgodnie z API plan)

**Implementacja**:
```typescript
// W generations.astro
const pageParam = Astro.url.searchParams.get('page');
const initialPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

// Walidacja: jeśli pageParam nie jest liczbą, użyj 1
if (isNaN(initialPage)) {
  initialPage = 1;
}
```

**Wpływ na UI**:
- Jeśli nieprawidłowy page param → użycie domyślnej wartości 1
- Brak komunikatu błędu (silent fallback)

### 9.2. Walidacja ID generacji (szczegóły)

**Komponenty**: `[id].astro`, `GenerationDetailView`, hook `useGenerationDetail`

**Warunki**:
- `id` musi być liczbą > 0
- `id` musi istnieć w bazie (weryfikowane przez API)

**Implementacja**:
```typescript
// W [id].astro
const { id } = Astro.params;
const generationId = parseInt(id || '0', 10);

// Walidacja
if (isNaN(generationId) || generationId <= 0) {
  return Astro.redirect('/generations'); // lub 404
}
```

**Wpływ na UI**:
- Jeśli nieprawidłowy ID → przekierowanie do listy
- Jeśli ID nie istnieje (404 z API) → wyświetlenie error state z możliwością powrotu

### 9.3. Obsługa null values dla acceptance counts

**Komponenty**: `AcceptanceRateIndicator`, `GenerationRow`

**Warunki**:
- `accepted_unedited_count` i `accepted_edited_count` mogą być `null` (nowo utworzona generacja bez zaakceptowanych fiszek)

**Implementacja**:
```typescript
const acceptedUnedited = generation.accepted_unedited_count ?? 0;
const acceptedEdited = generation.accepted_edited_count ?? 0;
const totalAccepted = acceptedUnedited + acceptedEdited;
```

**Wpływ na UI**:
- Wskaźnik akceptacji pokazuje 0% lub "—"
- Kolumna "Zaakceptowano" pokazuje "0 bez edycji / 0 z edycją"
- Progress bar jest pusty lub niewidoczny

### 9.4. Walidacja długości tekstu dla collapse/expand

**Komponenty**: `SourceTextSection`

**Warunki**:
- Przycisk "Pokaż więcej" jest widoczny tylko jeśli `sourceTextLength > 200`

**Implementacja**:
```typescript
const shouldShowToggle = sourceTextLength > 200;

return (
  <div>
    {/* Text display */}
    {shouldShowToggle && (
      <Button onClick={toggleExpanded}>
        {isExpanded ? 'Pokaż mniej' : 'Pokaż więcej'}
      </Button>
    )}
  </div>
);
```

**Wpływ na UI**:
- Jeśli tekst krótki → brak przycisku toggle

### 9.5. Empty state validation

**Komponenty**: `GenerationsView`

**Warunki**:
- Lista generacji jest pusta (`generations.length === 0`)
- Nie jest w trakcie ładowania (`isLoading === false`)
- Brak błędu (`error === null`)

**Implementacja**:
```typescript
if (!isLoading && !error && generations.length === 0) {
  return <GenerationsEmptyState />;
}
```

**Wpływ na UI**:
- Wyświetlenie komponentu `GenerationsEmptyState` z CTA do generowania fiszek

## 10. Obsługa błędów

### 10.1. Błąd ładowania listy generacji

**Scenariusz**: Request do `/api/generations` kończy się błędem (400, 500, 503, network error)

**Obsługa**:
1. Hook `useGenerationsList` wyłapuje błąd w try-catch
2. Ustawienie `error` state z odpowiednim komunikatem
3. `GenerationsView` wyświetla error state:
   ```tsx
   {error && (
     <Alert variant="destructive">
       <AlertCircle className="h-4 w-4" />
       <AlertTitle>Błąd</AlertTitle>
       <AlertDescription>
         {error.message}
         <Button onClick={() => refetch(pagination?.page || 1)}>
           Spróbuj ponownie
         </Button>
       </AlertDescription>
     </Alert>
   )}
   ```
4. Użytkownik może kliknąć "Spróbuj ponownie" aby ponownie wykonać request

**Toast notification**:
- Opcjonalnie: wyświetlenie toast z błędem zamiast inline Alert

### 10.2. Błąd 404 - generacja nie istnieje (szczegóły)

**Scenariusz**: Request do `/api/generations/{id}` zwraca 404

**Obsługa**:
1. Hook `useGenerationDetail` wyłapuje błąd z kodem 404
2. Ustawienie `error` state z komunikatem "Generacja nie została znaleziona"
3. `GenerationDetailView` wyświetla error state:
   ```tsx
   {error?.code === 'NOT_FOUND' && (
     <div className="text-center py-12">
       <h2>Generacja nie została znaleziona</h2>
       <p>Generacja o podanym ID nie istnieje lub została usunięta.</p>
       <Button asChild>
         <Link to="/generations">Wróć do listy generacji</Link>
       </Button>
     </div>
   )}
   ```

**Alternatywnie**: Przekierowanie do `/generations` z toast notification

### 10.3. Błąd sieci (network error)

**Scenariusz**: Brak połączenia z internetem lub serwer nie odpowiada

**Obsługa**:
1. Fetch wyrzuca błąd (TypeError: Failed to fetch)
2. Hook wyłapuje błąd i ustawia generyczny komunikat
3. Wyświetlenie error state z przyciskiem retry
4. Toast notification: "Sprawdź połączenie z internetem"

### 10.4. Błąd walidacji query params

**Scenariusz**: Nieprawidłowy page param (np. `?page=abc` lub `?page=-5`)

**Obsługa**:
1. Walidacja w `generations.astro` (server-side)
2. Silent fallback do `page = 1`
3. Brak komunikatu błędu dla użytkownika (UX: przyjazne domyślne wartości)

### 10.5. Timeout podczas generowania

**Scenariusz**: Request trwa bardzo długo (> 30s)

**Obsługa**:
1. Dodanie timeout do fetch:
   ```typescript
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 30000);
   
   fetch(url, { signal: controller.signal });
   ```
2. Po timeout wyrzucenie błędu "Request timeout"
3. Wyświetlenie error state z możliwością retry

### 10.6. Pusta lista flashcards w szczegółach

**Scenariusz**: Generacja istnieje, ale wszystkie fiszki zostały odrzucone (pusta tablica `flashcards`)

**Obsługa**:
1. Komponent `AssociatedFlashcardsSection` sprawdza `flashcards.length === 0`
2. Wyświetlenie empty state:
   ```tsx
   {flashcards.length === 0 ? (
     <div className="text-center py-8 text-muted-foreground">
       <p>Brak zaakceptowanych fiszek z tej generacji.</p>
       <p className="text-sm">Wszystkie propozycje zostały odrzucone.</p>
     </div>
   ) : (
     <FlashcardList flashcards={flashcards} />
   )}
   ```

## 11. Kroki implementacji

### Krok 1: Przygotowanie typów i API client
1. Dodać nowe typy ViewModels do `src/types.ts` (sekcja 5.2)
2. Utworzyć plik `src/lib/viewModels/generationViewModels.ts` z funkcjami pomocniczymi (sekcja 5.3)
3. Utworzyć plik `src/lib/api/generations.ts` z funkcjami API (sekcja 7.1)
4. Sprawdzić czy endpoint `/api/generations` jest zaimplementowany i działa

### Krok 2: Utworzenie custom hooks
1. Utworzyć plik `src/lib/hooks/useGenerationsList.ts` (sekcja 6.1)
2. Utworzyć plik `src/lib/hooks/useGenerationDetail.ts` (sekcja 6.2)
3. Dodać eksporty do `src/lib/hooks/index.ts`:
   ```typescript
   export { useGenerationsList } from './useGenerationsList';
   export { useGenerationDetail } from './useGenerationDetail';
   ```

### Krok 3: Utworzenie komponentów prezentacyjnych (bottom-up)

**3.1. AcceptanceRateIndicator**
- Utworzyć `src/components/generations/AcceptanceRateIndicator.tsx`
- Implementacja progress bar (użyć shadcn/ui Progress)
- Dodać tooltip z szczegółami (shadcn/ui Tooltip)
- Obsługa kolorystyki (red/yellow/green) na podstawie procentu

**3.2. GenerationRow**
- Utworzyć `src/components/generations/GenerationRow.tsx`
- Implementacja pojedynczego wiersza z wszystkimi kolumnami
- Użycie funkcji formatujących z `generationViewModels.ts`
- Integracja z `AcceptanceRateIndicator`
- Dodanie hover effects i click handler

**3.3. GenerationList**
- Utworzyć `src/components/generations/GenerationList.tsx`
- Implementacja tabeli (shadcn/ui Table)
- Nagłówki kolumn z odpowiednimi tytułami
- Mapowanie danych na `GenerationRow` komponenty

**3.4. GenerationsListSkeleton**
- Utworzyć `src/components/generations/GenerationsListSkeleton.tsx`
- Implementacja skeleton UI z 5 wierszami
- Użycie shadcn/ui Skeleton

**3.5. GenerationsEmptyState**
- Utworzyć `src/components/generations/GenerationsEmptyState.tsx`
- Implementacja pustego stanu z ikoną i CTA
- Link do `/generate`

### Krok 4: Utworzenie głównego widoku listy

**4.1. GenerationsView**
- Utworzyć `src/components/generations/GenerationsView.tsx`
- Integracja z hookiem `useGenerationsList`
- Implementacja warunkowego renderowania (loading/empty/error/list)
- Obsługa nawigacji do szczegółów
- Integracja z komponentem `Pagination` (reused)

**4.2. Astro page**
- Utworzyć `src/pages/generations.astro`
- Walidacja query params (page)
- Renderowanie `Layout` + `GenerationsView`
- Przekazanie `initialPage` z query params

**4.3. Index export**
- Utworzyć `src/components/generations/index.ts`:
   ```typescript
   export { GenerationsView } from './GenerationsView';
   export { GenerationList } from './GenerationList';
   export { GenerationRow } from './GenerationRow';
   export { AcceptanceRateIndicator } from './AcceptanceRateIndicator';
   export { GenerationsListSkeleton } from './GenerationsListSkeleton';
   export { GenerationsEmptyState } from './GenerationsEmptyState';
   ```

### Krok 5: Utworzenie widoku szczegółów generacji

**5.1. Komponenty szczegółów**
- Utworzyć `src/components/generations/GenerationDetailHeader.tsx`
- Utworzyć `src/components/generations/GenerationStatsGrid.tsx`
- Utworzyć `src/components/generations/SourceTextSection.tsx`
  - **UWAGA**: Sprawdzić czy API zwraca pełny `source_text` czy tylko hash
  - Jeśli tylko hash: wyświetlać hash + długość bez collapse/expand
- Utworzyć `src/components/generations/AssociatedFlashcardsSection.tsx`

**5.2. GenerationDetailView**
- Utworzyć `src/components/generations/GenerationDetailView.tsx`
- Integracja z hookiem `useGenerationDetail`
- Implementacja conditional rendering (loading/error/detail)
- Przycisk powrotu do listy
- Obsługa błędu 404

**5.3. Astro page szczegółów**
- Utworzyć `src/pages/generations/[id].astro`
- Walidacja path param `id`
- Renderowanie `Layout` + `GenerationDetailView`
- Przekazanie `generationId` z params

**5.4. Update index export**
- Dodać nowe komponenty do `src/components/generations/index.ts`

### Krok 6: Styling i responsywność

**6.1. Responsywność tabeli**
- Na desktop: pełna tabela
- Na tablet: ukrycie mniej istotnych kolumn (np. czas generowania)
- Na mobile: card layout zamiast tabeli (opcjonalnie) lub horizontal scroll

**6.2. Tailwind classes**
- Wykorzystanie klas Tailwind 4
- Spójność z resztą aplikacji (colors, spacing, typography)

**6.3. Animacje i transitions**
- Smooth transitions dla hover effects
- Loading animations dla skeletonów
- Fade-in dla pojawiających się danych

### Krok 7: Integracja z nawigacją

**7.1. Dodanie linku w menu**
- Update `src/components/dashboard/MenuGrid.tsx` (jeśli istnieje) lub głównej nawigacji
- Dodanie kafelka "Historia generacji" z linkiem do `/generations`
- Ikona: `History` lub `FileText` z lucide-react

**7.2. Breadcrumbs** (opcjonalnie)
- Dodanie breadcrumbs w widoku szczegółów: Home > Historia generacji > Generacja #123

### Krok 8: Obsługa błędów i edge cases

**8.1. Error boundaries**
- Dodanie error boundary dla React komponentów (opcjonalnie)

**8.2. Toast notifications**
- Integracja z `ToasterProvider`
- Wyświetlanie toastów po błędach
- Sukces toast po powrocie z szczegółów (opcjonalnie)

**8.3. Testy edge cases**
- Pusta lista generacji
- Brak zaakceptowanych fiszek w generacji
- Bardzo długie teksty
- Null values w acceptance counts
- Nieprawidłowe query/path params

### Krok 9: Dostępność (a11y)

**9.1. Semantic HTML**
- Użycie `<table>`, `<thead>`, `<tbody>`, `<th>` dla tabeli
- Proper heading hierarchy (h1, h2, h3)

**9.2. ARIA attributes**
- `aria-label` dla przycisków bez tekstu
- `aria-sort` dla sortowanych kolumn (jeśli dodane sortowanie)
- `role="status"` dla loading states

**9.3. Keyboard navigation**
- Tabela jest keyboard-accessible
- Focus states dla interaktywnych elementów
- Tab order logiczny

**9.4. Screen reader support**
- Alt texts dla ikon
- Opisowe linki ("Zobacz szczegóły generacji #123" zamiast tylko "Zobacz")

### Krok 10: Testowanie

**10.1. Manual testing**
- Testowanie wszystkich interakcji użytkownika
- Testowanie różnych stanów (loading, error, empty, success)
- Testowanie paginacji (pierwsza, ostatnia, środkowa strona)
- Testowanie na różnych rozdzielczościach (mobile, tablet, desktop)

**10.2. Integration testing** (opcjonalnie)
- Testy hooków z mock API
- Testy komponentów z React Testing Library

**10.3. E2E testing** (opcjonalnie)
- Testy całego flow: lista → szczegóły → powrót

### Krok 11: Dokumentacja

**11.1. README dla komponentów**
- Utworzyć `src/components/generations/README.md` z opisem struktury

**11.2. Code comments**
- Dodanie JSDoc comments do funkcji i komponentów
- Opisanie złożonych logik

**11.3. Storybook** (opcjonalnie)
- Stories dla poszczególnych komponentów

### Krok 12: Optymalizacja i polish

**12.1. Performance**
- Lazy loading dla widoku szczegółów (jeśli duże dane)
- Memoizacja komponentów (React.memo) gdzie potrzebne
- Optimistic UI updates (opcjonalnie)

**12.2. UX improvements**
- Smooth scroll do top przy zmianie strony
- Zachowanie scroll position przy powrocie z szczegółów (opcjonalnie)
- Loading indicators podczas nawigacji

**12.3. Final review**
- Code review
- Sprawdzenie zgodności z PRD i design system
- Sprawdzenie dostępności
- Sprawdzenie responsywności

---

## Podsumowanie

Plan implementacji widoku Historii Generacji obejmuje:
- **2 strony Astro**: `/generations` i `/generations/[id]`
- **11 komponentów React**: GenerationsView, GenerationList, GenerationRow, AcceptanceRateIndicator, GenerationsListSkeleton, GenerationsEmptyState, GenerationDetailView, GenerationDetailHeader, GenerationStatsGrid, SourceTextSection, AssociatedFlashcardsSection
- **2 custom hooki**: useGenerationsList, useGenerationDetail
- **1 API client**: generations.ts z funkcjami fetchGenerations i fetchGenerationById
- **Nowe typy**: 8 ViewModels + 3 utility functions

Implementacja powinna zająć około 2-3 dni roboczych dla doświadczonego frontend developera, z uwzględnieniem testowania i poprawek.

