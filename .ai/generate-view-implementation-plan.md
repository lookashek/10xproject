# Plan implementacji widoku Generowania Fiszek

## 1. Przegląd

Widok Generowania Fiszek umożliwia użytkownikom automatyczne tworzenie fiszek edukacyjnych przy użyciu AI. Użytkownik wkleja tekst źródłowy (1000-10000 znaków), który jest następnie przetwarzany przez model językowy LLM, generujący propozycje fiszek. Użytkownik może przeglądać, edytować, akceptować lub odrzucać wygenerowane propozycje przed zapisaniem ich do bazy danych.

Kluczowe funkcjonalności widoku:

- Formularz z textarea do wprowadzania tekstu źródłowego
- Real-time walidacja długości tekstu z wizualnym licznikiem znaków
- Generowanie propozycji fiszek przez AI z informacją o postępie
- Przeglądanie i edycja wygenerowanych propozycji
- Selekcja propozycji do zaakceptowania (domyślnie wszystkie zaznaczone)
- Zapis wybranych fiszek jako batch do bazy danych
- Obsługa błędów z informa­cyjnymi komunikatami dla użytkownika

## 2. Routing widoku

**Ścieżka**: `/generate`

**Typ**: Chroniony widok (wymaga uwierzytelnienia)

**Plik**: `src/pages/generate.astro`

**Middleware**: Widok chroniony przez middleware sprawdzające obecność tokenu JWT. W przypadku braku tokenu użytkownik zostanie przekierowany do `/login`.

**Nawigacja**:

- Dostępny z dashboard przez kafelek "Generuj fiszki"
- Logo w headerze umożliwia powrót do `/dashboard`
- Po zapisaniu fiszek użytkownik pozostaje na tej samej stronie z wyczyszczonym formularzem

## 3. Struktura komponentów

Widok składa się z następującej hierarchii komponentów:

```
generate.astro (Astro page)
├── Layout.astro
│   └── DashboardHeader (React)
│       ├── Logo (link do /dashboard)
│       ├── DarkModeToggle (React)
│       └── UserDropdown (React)
└── GenerateView (React) [client:load]
    ├── GenerateForm (React)
    │   ├── Textarea (shadcn/ui)
    │   ├── CharacterCounter (React)
    │   └── Button (shadcn/ui)
    ├── LoadingIndicator (React) [warunkowy]
    │   └── Spinner + tekst
    └── ProposalSection (React) [warunkowy]
        ├── ProposalList (React)
        │   ├── SelectionControls (React)
        │   │   ├── Button "Zaznacz wszystkie"
        │   │   ├── Button "Odznacz wszystkie"
        │   │   └── Counter "Zaznaczono X z Y"
        │   ├── ProposalCard[] (React)
        │   │   ├── Checkbox (shadcn/ui)
        │   │   ├── Badge "AI" (shadcn/ui)
        │   │   ├── Input [front] (shadcn/ui)
        │   │   └── Textarea [back] (shadcn/ui)
        │   └── Button "Zapisz wybrane fiszki"
        └── Toast (shadcn/ui) [komunikaty]
```

**Podział odpowiedzialności**:

- `generate.astro` - Strona Astro, wrapper dla komponentu React
- `GenerateView` - Główny kontener React zarządzający stanem całego widoku
- `GenerateForm` - Formularz do wprowadzania tekstu źródłowego
- `ProposalSection` - Sekcja z propozycjami (pojawia się po wygenerowaniu)
- `ProposalList` - Lista propozycji z kontrolkami
- `ProposalCard` - Pojedyncza karta propozycji

## 4. Szczegóły komponentów

### 4.1. GenerateView (główny kontener)

**Opis**: Główny komponent React zarządzający całym przepływem widoku generowania fiszek. Odpowiada za orkiestrację stanu aplikacji, wywołania API oraz koordynację podkomponentów.

**Główne elementy HTML i komponenty**:

```tsx
<div className="container mx-auto px-4 py-8 max-w-4xl">
  <header>
    <h1>Generuj fiszki AI</h1>
    <p>Opis...</p>
  </header>

  <GenerateForm />

  {isLoading && <LoadingIndicator />}

  {proposalData && <ProposalSection />}
</div>
```

**Obsługiwane zdarzenia**:

- `handleGenerate(sourceText: string)` - Wywołanie API generowania, obsługa loading state
- `handleSaveSelected()` - Zapisywanie zaznaczonych i edytowanych fiszek
- `handleReset()` - Reset stanu po pomyślnym zapisaniu lub cancel

**Warunki walidacji**:

- Brak - komponent orchestrator, walidację wykonują podkomponenty

**Typy wymagane**:

- `GenerateViewState` - stan widoku
- `GenerationData` - dane wygenerowane z API
- Typy z API: `GenerationCreateResponse`, `ProposedFlashcard`

**Propsy**: Brak (komponent top-level)

### 4.2. GenerateForm

**Opis**: Formularz do wprowadzania tekstu źródłowego. Zawiera textarea z walidacją długości tekstu (1000-10000 znaków), licznik znaków w czasie rzeczywistym oraz przycisk generowania.

**Główne elementy HTML i komponenty**:

```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  <div>
    <Label htmlFor="source-text">
      Tekst źródłowy
      <span className="text-muted-foreground"> (1000-10000 znaków)</span>
    </Label>
    <Textarea
      id="source-text"
      value={sourceText}
      onChange={handleChange}
      placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki..."
      className="min-h-[300px]"
      disabled={isLoading}
      aria-describedby="char-counter char-error"
      aria-invalid={!isValid}
    />
    <CharacterCounter current={charCount} min={1000} max={10000} isValid={isValid} />
    {validationError && (
      <p id="char-error" className="text-sm text-destructive">
        {validationError}
      </p>
    )}
  </div>

  <Button type="submit" disabled={!isValid || isLoading} className="w-full">
    {isLoading ? (
      <>
        <Loader2 className="animate-spin" />
        Generowanie...
      </>
    ) : (
      <>
        <Sparkles />
        Generuj fiszki
      </>
    )}
  </Button>
</form>
```

**Obsługiwane zdarzenia**:

- `handleChange(e)` - Update stanu textarea, walidacja real-time
- `handleSubmit(e)` - Wywołanie callback `onGenerate` z walidowanym tekstem
- `handleKeyDown(e)` - Obsługa Ctrl+Enter dla szybkiego submitu

**Warunki walidacji**:

- **Długość tekstu**: min 1000, max 10000 znaków
- **Tekst niepusty**: po trim() musi mieć zawartość
- **Disable przycisku**: gdy tekst nieprawidłowy lub trwa ładowanie
- **Wizualna informacja**: licznik znaków zmienia kolor na czerwony gdy invalid

**Typy wymagane**:

- `GenerateFormProps` - propsy komponentu
- `GenerateFormState` - lokalny stan (sourceText, isValid, charCount)

**Propsy**:

```typescript
interface GenerateFormProps {
  onGenerate: (sourceText: string) => Promise<void>;
  isLoading: boolean;
}
```

### 4.3. CharacterCounter

**Opis**: Komponent wyświetlający licznik znaków w czasie rzeczywistym z wizualną informacją o poprawności długości tekstu.

**Główne elementy HTML i komponenty**:

```tsx
<div
  className={cn("flex justify-between text-sm", isValid ? "text-muted-foreground" : "text-destructive")}
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <span>
    {current < min && `Minimum ${min} znaków`}
    {current > max && `Maksimum ${max} znaków`}
    {isValid && "Długość poprawna"}
  </span>
  <span className="font-mono">
    {current.toLocaleString("pl-PL")} / {max.toLocaleString("pl-PL")}
  </span>
</div>
```

**Obsługiwane zdarzenia**: Brak (komponent prezentacyjny)

**Warunki walidacji**: Brak (otrzymuje stan walidacji z rodzica)

**Typy wymagane**:

```typescript
interface CharacterCounterProps {
  current: number;
  min: number;
  max: number;
  isValid: boolean;
}
```

**Propsy**: Zgodne z `CharacterCounterProps`

### 4.4. LoadingIndicator

**Opis**: Komponent wyświetlany podczas generowania fiszek przez AI. Pokazuje spinner i tekst informujący o trwającej operacji.

**Główne elementy HTML i komponenty**:

```tsx
<div className="flex flex-col items-center justify-center py-12 space-y-4">
  <Loader2 className="h-12 w-12 animate-spin text-primary" />
  <div className="text-center space-y-2">
    <p className="text-lg font-medium">Generowanie fiszek...</p>
    <p className="text-sm text-muted-foreground">To może potrwać kilka sekund</p>
  </div>
</div>
```

**Obsługiwane zdarzenia**: Brak

**Warunki walidacji**: Brak

**Typy wymagane**: Brak (lub opcjonalny `text?: string`)

**Propsy**:

```typescript
interface LoadingIndicatorProps {
  text?: string;
  subtext?: string;
}
```

### 4.5. ProposalSection

**Opis**: Sekcja zawierająca listę wygenerowanych propozycji wraz z kontrolkami do zaznaczania i zapisywania. Renderowana tylko po pomyślnym wygenerowaniu propozycji.

**Główne elementy HTML i komponenty**:

```tsx
<section className="space-y-6">
  <header>
    <h2 className="text-2xl font-semibold">Wygenerowane propozycje</h2>
    <p className="text-muted-foreground">Przejrzyj propozycje, edytuj jeśli potrzeba i wybierz, które chcesz zapisać</p>
  </header>

  <ProposalList proposals={proposals} generationId={generationId} onSave={handleSave} />
</section>
```

**Obsługiwane zdarzenia**: Przekazuje handlery do `ProposalList`

**Warunki walidacji**: Brak (komponent wrapper)

**Typy wymagane**:

```typescript
interface ProposalSectionProps {
  generationData: GenerationData;
  onSave: (flashcards: FlashcardCreateCommand[]) => Promise<void>;
}
```

**Propsy**: Zgodne z `ProposalSectionProps`

### 4.6. ProposalList

**Opis**: Lista propozycji fiszek z kontrolkami do zaznaczania wszystkich/żadnych oraz przyciskiem zapisu. Zarządza stanem zaznaczenia i edycji każdej propozycji.

**Główne elementy HTML i komponenty**:

```tsx
<div className="space-y-4">
  {/* Kontrolki zaznaczania */}
  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleSelectAll}>
        Zaznacz wszystkie
      </Button>
      <Button variant="outline" size="sm" onClick={handleDeselectAll}>
        Odznacz wszystkie
      </Button>
    </div>
    <div className="text-sm font-medium">
      Zaznaczono: <span className="text-primary">{selectedCount}</span> z {totalCount}
    </div>
  </div>

  {/* Lista propozycji */}
  <div className="space-y-3">
    {proposals.map((proposal, index) => (
      <ProposalCard
        key={index}
        proposal={proposal}
        index={index}
        isSelected={selectedIds.has(index)}
        onToggleSelect={handleToggleSelect}
        onEdit={handleEdit}
      />
    ))}
  </div>

  {/* Przycisk zapisu */}
  <div className="flex justify-end pt-4">
    <Button size="lg" onClick={handleSave} disabled={selectedCount === 0 || isSaving} className="min-w-[200px]">
      {isSaving ? (
        <>
          <Loader2 className="animate-spin" />
          Zapisywanie...
        </>
      ) : (
        <>
          <Save />
          Zapisz wybrane ({selectedCount})
        </>
      )}
    </Button>
  </div>
</div>
```

**Obsługiwane zdarzenia**:

- `handleSelectAll()` - Zaznaczenie wszystkich propozycji
- `handleDeselectAll()` - Odznaczenie wszystkich propozycji
- `handleToggleSelect(index)` - Toggle zaznaczenia pojedynczej propozycji
- `handleEdit(index, field, value)` - Zapisanie edycji propozycji
- `handleSave()` - Przygotowanie danych i wywołanie `onSave`

**Warunki walidacji**:

- **Minimum jedna zaznaczona**: Przycisk zapisu disabled gdy `selectedCount === 0`
- **Walidacja edytowanych pól**: Każde edytowane pole musi spełniać kryteria (max 200/500 znaków)
- **Określenie source**: Edytowana propozycja = "ai-edited", nieedytowana = "ai-full"

**Typy wymagane**:

```typescript
interface ProposalListProps {
  proposals: ProposedFlashcard[];
  generationId: number;
  onSave: (flashcards: FlashcardCreateCommand[]) => Promise<void>;
}

interface ProposalListState {
  selectedIds: Set<number>;
  editedProposals: Map<number, { front?: string; back?: string }>;
  isSaving: boolean;
}
```

**Propsy**: Zgodne z `ProposalListProps`

### 4.7. ProposalCard

**Opis**: Pojedyncza karta propozycji fiszki z możliwością zaznaczenia, inline edycji i wizualnym wskaźnikiem źródła (badge "AI").

**Główne elementy HTML i komponenty**:

```tsx
<Card className={cn("p-4 transition-all", isSelected ? "border-primary bg-primary/5" : "border-border")}>
  <div className="flex gap-3">
    {/* Checkbox */}
    <div className="pt-1">
      <Checkbox
        id={`proposal-${index}`}
        checked={isSelected}
        onCheckedChange={(checked) => onToggleSelect(index, checked as boolean)}
        aria-label={`Zaznacz propozycję ${index + 1}`}
      />
    </div>

    {/* Treść */}
    <div className="flex-1 space-y-3">
      {/* Header z numerem i badge */}
      <div className="flex items-center justify-between">
        <Label htmlFor={`proposal-${index}`} className="text-sm font-medium">
          Fiszka {index + 1}
        </Label>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          AI
        </Badge>
      </div>

      {/* Front (Pytanie) */}
      <div className="space-y-1.5">
        <Label htmlFor={`front-${index}`} className="text-xs text-muted-foreground">
          Przód (pytanie)
        </Label>
        <Input
          id={`front-${index}`}
          value={currentFront}
          onChange={(e) => handleFrontChange(e.target.value)}
          maxLength={200}
          disabled={!isSelected}
          className={cn(!isSelected && "opacity-50")}
          aria-describedby={`front-counter-${index}`}
        />
        <div id={`front-counter-${index}`} className="text-xs text-muted-foreground text-right">
          {currentFront.length} / 200
        </div>
      </div>

      {/* Back (Odpowiedź) */}
      <div className="space-y-1.5">
        <Label htmlFor={`back-${index}`} className="text-xs text-muted-foreground">
          Tył (odpowiedź)
        </Label>
        <Textarea
          id={`back-${index}`}
          value={currentBack}
          onChange={(e) => handleBackChange(e.target.value)}
          maxLength={500}
          rows={3}
          disabled={!isSelected}
          className={cn(!isSelected && "opacity-50")}
          aria-describedby={`back-counter-${index}`}
        />
        <div id={`back-counter-${index}`} className="text-xs text-muted-foreground text-right">
          {currentBack.length} / 500
        </div>
      </div>
    </div>
  </div>
</Card>
```

**Obsługiwane zdarzenia**:

- `onToggleSelect(index, checked)` - Zmiana stanu zaznaczenia
- `handleFrontChange(value)` - Edycja front, wywołanie `onEdit`
- `handleBackChange(value)` - Edycja back, wywołanie `onEdit`

**Warunki walidacji**:

- **Max length front**: 200 znaków
- **Max length back**: 500 znaków
- **Disabled gdy niezaznaczone**: Input/Textarea disabled gdy `!isSelected`
- **Wizualne liczniki**: Pokazują aktualną liczbę znaków / max

**Typy wymagane**:

```typescript
interface ProposalCardProps {
  proposal: ProposedFlashcard;
  index: number;
  isSelected: boolean;
  onToggleSelect: (index: number, checked: boolean) => void;
  onEdit: (index: number, field: "front" | "back", value: string) => void;
}
```

**Propsy**: Zgodne z `ProposalCardProps`

## 5. Typy

### 5.1. Typy już istniejące (z `src/types.ts`)

Następujące typy są już zdefiniowane i mogą być używane bezpośrednio:

```typescript
// Command do generowania
export type GenerationCreateCommand = {
  source_text: string;
};

// Odpowiedź z API generowania
export type GenerationCreateResponse = {
  generation: GenerationDTO;
  proposed_flashcards: ProposedFlashcard[];
};

// Propozycja fiszki od AI
export type ProposedFlashcard = {
  front: string;
  back: string;
  source: "ai-full";
};

// Command do tworzenia pojedynczej fiszki
export type FlashcardCreateCommand = {
  front: string;
  back: string;
  source: FlashcardSource; // 'ai-full' | 'ai-edited' | 'manual'
  generation_id?: number | null;
};

// Command do batch creation
export type FlashcardBatchCreateCommand = {
  flashcards: FlashcardCreateCommand[];
};

// DTO generacji (odpowiedź z API)
export type GenerationDTO = Omit<GenerationEntity, "user_id">;
```

### 5.2. Nowe typy ViewModel (do dodania)

Należy utworzyć plik `src/lib/viewModels/generateView.types.ts` z następującymi typami:

```typescript
import type { ProposedFlashcard, GenerationDTO, FlashcardCreateCommand } from "../../types";

/**
 * Stan głównego widoku GenerateView
 */
export interface GenerateViewState {
  // Faza widoku
  phase: "input" | "loading" | "reviewing" | "saving";

  // Dane wygenerowane z API (null przed generowaniem)
  generationData: GenerationData | null;

  // Stan ładowania i błędów
  isLoading: boolean;
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
  // Opcjonalnie: początkowy tekst (np. z query params)
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
  // Set indeksów zaznaczonych propozycji
  selectedIds: Set<number>;

  // Mapa edytowanych pól (index -> zmiany)
  editedProposals: Map<number, ProposalEdit>;

  // Stan zapisywania
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
```

### 5.3. Typy pomocnicze dla API client

W pliku `src/lib/api/client.ts` (jeśli nie istnieje) lub w dedykowanym pliku API:

```typescript
/**
 * Struktura błędu API
 */
export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: {
      field?: string;
      existing_generation_id?: number;
      [key: string]: unknown;
    };
  };
}

/**
 * Kody błędów API
 */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_SERVER_ERROR"
  | "SERVICE_UNAVAILABLE";
```

## 6. Zarządzanie stanem

### 6.1. Stan globalny widoku

**Lokalizacja**: `GenerateView` komponent (useState hooks)

**Struktura stanu**:

```typescript
const [viewState, setViewState] = useState<GenerateViewState>({
  phase: "input",
  generationData: null,
  isLoading: false,
  error: null,
});
```

**Fazy widoku**:

1. **'input'** - Użytkownik wprowadza tekst, formularz aktywny
2. **'loading'** - Trwa generowanie przez AI, wyświetlany LoadingIndicator
3. **'reviewing'** - Propozycje wyświetlone, użytkownik przegląda i edytuje
4. **'saving'** - Trwa zapisywanie zaznaczonych fiszek do bazy

**Przejścia między fazami**:

```
input -> (submit) -> loading -> (success) -> reviewing -> (save) -> saving -> (success) -> input
                              -> (error) -> input
```

### 6.2. Stan formularza (GenerateForm)

**Lokalizacja**: `GenerateForm` komponent (useState)

**Struktura**:

```typescript
const [formState, setFormState] = useState<GenerateFormState>({
  sourceText: initialValue || "",
  charCount: initialValue?.length || 0,
  isValid: false,
  validationError: null,
});
```

**Walidacja real-time**:

```typescript
const validateText = (text: string): boolean => {
  const trimmed = text.trim();
  const length = trimmed.length;

  if (length < 1000) {
    setFormState((prev) => ({
      ...prev,
      isValid: false,
      validationError: `Tekst musi mieć minimum 1000 znaków (aktualnie: ${length})`,
    }));
    return false;
  }

  if (length > 10000) {
    setFormState((prev) => ({
      ...prev,
      isValid: false,
      validationError: `Tekst może mieć maksymalnie 10000 znaków (aktualnie: ${length})`,
    }));
    return false;
  }

  setFormState((prev) => ({
    ...prev,
    isValid: true,
    validationError: null,
  }));
  return true;
};
```

### 6.3. Stan propozycji (ProposalList)

**Lokalizacja**: `ProposalList` komponent (useState)

**Struktura**:

```typescript
const [selectedIds, setSelectedIds] = useState<Set<number>>(
  new Set(proposals.map((_, index) => index)) // Domyślnie wszystkie zaznaczone
);

const [editedProposals, setEditedProposals] = useState<Map<number, ProposalEdit>>(new Map());

const [isSaving, setIsSaving] = useState(false);
```

**Operacje na stanie**:

```typescript
// Zaznaczenie wszystkich
const handleSelectAll = () => {
  setSelectedIds(new Set(proposals.map((_, i) => i)));
};

// Odznaczenie wszystkich
const handleDeselectAll = () => {
  setSelectedIds(new Set());
};

// Toggle pojedynczej propozycji
const handleToggleSelect = (index: number, checked: boolean) => {
  setSelectedIds((prev) => {
    const newSet = new Set(prev);
    if (checked) {
      newSet.add(index);
    } else {
      newSet.delete(index);
    }
    return newSet;
  });
};

// Edycja propozycji
const handleEdit = (index: number, field: "front" | "back", value: string) => {
  setEditedProposals((prev) => {
    const newMap = new Map(prev);
    const currentEdit = newMap.get(index) || {};
    newMap.set(index, {
      ...currentEdit,
      [field]: value,
    });
    return newMap;
  });
};
```

### 6.4. Custom hook (opcjonalny)

Można wydzielić logikę do custom hooka dla lepszej organizacji:

**Plik**: `src/lib/hooks/useGenerateFlashcards.ts`

```typescript
import { useState, useCallback } from "react";
import type { GenerateViewState, GenerationData, GenerateViewError } from "../viewModels/generateView.types";

export function useGenerateFlashcards() {
  const [viewState, setViewState] = useState<GenerateViewState>({
    phase: "input",
    generationData: null,
    isLoading: false,
    error: null,
  });

  const generateFlashcards = useCallback(async (sourceText: string) => {
    // Implementacja wywołania API
    // ...
  }, []);

  const saveFlashcards = useCallback(async (flashcards: FlashcardCreateCommand[]) => {
    // Implementacja zapisu
    // ...
  }, []);

  const reset = useCallback(() => {
    setViewState({
      phase: "input",
      generationData: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    viewState,
    generateFlashcards,
    saveFlashcards,
    reset,
  };
}
```

## 7. Integracja API

### 7.1. Endpoint: POST /api/generations

**Cel**: Generowanie propozycji fiszek z tekstu źródłowego

**Request**:

```typescript
// Typ
type GenerationCreateCommand = {
  source_text: string;
};

// Przykład
const request = {
  source_text: "TypeScript is a strongly typed programming language...",
};
```

**Response (201 Created)**:

```typescript
// Typ
type GenerationCreateResponse = {
  generation: GenerationDTO;
  proposed_flashcards: ProposedFlashcard[];
}

// Przykład
{
  "generation": {
    "id": 46,
    "model": "anthropic/claude-3.5-sonnet",
    "generated_count": 5,
    "accepted_unedited_count": null,
    "accepted_edited_count": null,
    "source_text_hash": "a7f2b3...",
    "source_text_length": 1543,
    "generation_duration": 3200,
    "created_at": "2025-10-07T12:00:00Z",
    "updated_at": "2025-10-07T12:00:00Z"
  },
  "proposed_flashcards": [
    {
      "front": "What is TypeScript?",
      "back": "A strongly typed programming language that builds on JavaScript",
      "source": "ai-full"
    },
    {
      "front": "What are the benefits of TypeScript?",
      "back": "Type safety, better IDE support, early error detection",
      "source": "ai-full"
    }
  ]
}
```

**Error Responses**:

1. **400 Bad Request** - Nieprawidłowe dane wejściowe

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {
      "field": "source_text"
    }
  }
}
```

2. **409 Conflict** - Duplikat generacji (ten sam tekst już wygenerowany)

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Generation already exists for this source text",
    "details": {
      "existing_generation_id": 42
    }
  }
}
```

3. **422 Unprocessable Entity** - Walidacja długości tekstu

```json
{
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "message": "Source text must be at least 1000 characters",
    "details": {
      "field": "source_text",
      "min": 1000,
      "actual": 543
    }
  }
}
```

4. **500 Internal Server Error** - Błąd LLM

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Failed to generate flashcards"
  }
}
```

5. **503 Service Unavailable** - Niedostępność LLM API

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "AI service temporarily unavailable"
  }
}
```

**Implementacja wywołania**:

```typescript
async function generateFlashcards(sourceText: string): Promise<GenerationData> {
  const response = await fetch("/api/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source_text: sourceText }),
  });

  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();
    throw new ApiError(errorData);
  }

  const data: GenerationCreateResponse = await response.json();

  return {
    generation: data.generation,
    proposals: data.proposed_flashcards,
  };
}
```

### 7.2. Endpoint: POST /api/flashcards

**Cel**: Zapisywanie zaakceptowanych fiszek (batch)

**Request**:

```typescript
// Typ
type FlashcardBatchCreateCommand = {
  flashcards: FlashcardCreateCommand[];
};

// FlashcardCreateCommand:
type FlashcardCreateCommand = {
  front: string;
  back: string;
  source: "ai-full" | "ai-edited" | "manual";
  generation_id?: number | null;
};

// Przykład
const request = {
  flashcards: [
    {
      front: "What is TypeScript?",
      back: "A strongly typed programming language...",
      source: "ai-full",
      generation_id: 46,
    },
    {
      front: "What are TypeScript benefits? (edited)",
      back: "Type safety and IDE support",
      source: "ai-edited",
      generation_id: 46,
    },
  ],
};
```

**Response (201 Created)**:

```typescript
// Typ
type FlashcardListResponse = {
  data: FlashcardDTO[];
}

// Przykład
{
  "data": [
    {
      "id": 124,
      "front": "What is TypeScript?",
      "back": "A strongly typed programming language...",
      "source": "ai-full",
      "generation_id": 46,
      "created_at": "2025-10-07T12:05:00Z",
      "updated_at": "2025-10-07T12:05:00Z"
    },
    {
      "id": 125,
      "front": "What are TypeScript benefits? (edited)",
      "back": "Type safety and IDE support",
      "source": "ai-edited",
      "generation_id": 46,
      "created_at": "2025-10-07T12:05:00Z",
      "updated_at": "2025-10-07T12:05:00Z"
    }
  ]
}
```

**Error Responses**:

1. **400 Bad Request** - Nieprawidłowe dane
2. **409 Conflict** - Duplikat fiszki
3. **422 Unprocessable Entity** - Walidacja (front > 200 chars, back > 500 chars)

**Implementacja wywołania**:

```typescript
async function saveFlashcards(flashcards: FlashcardCreateCommand[]): Promise<void> {
  const response = await fetch("/api/flashcards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ flashcards }),
  });

  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();
    throw new ApiError(errorData);
  }

  // Sukces - brak zwracanej wartości potrzebnej
  return;
}
```

### 7.3. Wrapper API client

**Plik**: `src/lib/api/generations.ts`

```typescript
import type { GenerationCreateCommand, GenerationCreateResponse, FlashcardBatchCreateCommand } from "../../types";
import type { GenerationData } from "../viewModels/generateView.types";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Generuje fiszki z tekstu źródłowego
 */
export async function generateFlashcardsFromText(sourceText: string): Promise<GenerationData> {
  try {
    const response = await fetch("/api/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_text: sourceText,
      } as GenerationCreateCommand),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(response.status, errorData.error.code, errorData.error.message, errorData.error.details);
    }

    const data: GenerationCreateResponse = await response.json();

    return {
      generation: data.generation,
      proposals: data.proposed_flashcards,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error
    throw new ApiError(0, "NETWORK_ERROR", "Sprawdź połączenie internetowe i spróbuj ponownie");
  }
}

/**
 * Zapisuje zaakceptowane fiszki
 */
export async function saveAcceptedFlashcards(flashcards: FlashcardCreateCommand[]): Promise<void> {
  try {
    const response = await fetch("/api/flashcards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        flashcards,
      } as FlashcardBatchCreateCommand),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(response.status, errorData.error.code, errorData.error.message, errorData.error.details);
    }

    // Success
    return;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error
    throw new ApiError(0, "NETWORK_ERROR", "Sprawdź połączenie internetowe i spróbuj ponownie");
  }
}
```

## 8. Interakcje użytkownika

### 8.1. Wprowadzanie tekstu źródłowego

**Akcja**: Użytkownik wpisuje/wkleja tekst w textarea

**Przepływ**:

1. Użytkownik fokusuje textarea
2. Wkleja lub wpisuje tekst
3. **Real-time**: `onChange` event aktualizuje stan `sourceText`
4. **Real-time**: Obliczany jest `charCount` (length po trim)
5. **Real-time**: Wykonywana jest walidacja (1000-10000 chars)
6. **Wizualnie**: Licznik znaków zmienia kolor:
   - Czerwony jeśli < 1000 lub > 10000
   - Zielony/neutralny jeśli w zakresie
7. **Przycisk**: Enabled/disabled na podstawie `isValid`

**Keyboard shortcuts**:

- **Ctrl+Enter**: Submit formularza (tylko gdy `isValid`)

### 8.2. Generowanie fiszek

**Akcja**: Użytkownik klika "Generuj fiszki"

**Przepływ**:

1. Kliknięcie przycisku lub Ctrl+Enter
2. Walidacja tekstu (jeśli invalid, nie submit)
3. `onGenerate(sourceText)` wywołane
4. **UI update**:
   - `phase` → 'loading'
   - `isLoading` → true
   - Formularz disabled
   - Wyświetlany `LoadingIndicator`
5. **API call**: `POST /api/generations`
6. **Oczekiwanie**: 1-10 sekund (w zależności od LLM)
7. **Success**:
   - `phase` → 'reviewing'
   - `generationData` ustawiona
   - Renderowana `ProposalSection`
8. **Error**:
   - `phase` → 'input'
   - `error` ustawiony
   - Toast z komunikatem błędu

### 8.3. Przeglądanie propozycji

**Akcja**: Użytkownik przegląda wygenerowane propozycje

**Przepływ**:

1. Wyświetlona lista propozycji
2. **Domyślnie**: Wszystkie propozycje zaznaczone (checkbox checked)
3. Użytkownik może:
   - Odznaczać niepotrzebne propozycje (kliknięcie checkbox)
   - Kliknąć "Odznacz wszystkie" → wszystkie odznaczone
   - Kliknąć "Zaznacz wszystkie" → wszystkie zaznaczone
4. **Licznik**: Aktualizuje się real-time: "Zaznaczono X z Y"

### 8.4. Edycja propozycji

**Akcja**: Użytkownik edytuje tekst propozycji

**Przepływ**:

1. Użytkownik fokusuje Input (front) lub Textarea (back)
2. Modyfikuje tekst
3. **onChange**:
   - Aktualizacja `editedProposals` Map
   - Zapisanie zmiany dla danego indeksu i pola
4. **Licznik znaków**: Wyświetlany pod polem (X / 200 lub X / 500)
5. **Walidacja**:
   - Max length enforced przez `maxLength` attribute
   - Jeśli przekroczony, input nie pozwala na więcej znaków
6. **Oznaczenie edycji**:
   - Jeśli propozycja edytowana → `source: 'ai-edited'`
   - Jeśli nieedytowana → `source: 'ai-full'`

**Ograniczenia**:

- Edycja możliwa tylko dla zaznaczonych propozycji (gdy `isSelected`)
- Input/Textarea disabled gdy niezaznaczone

### 8.5. Zapisywanie fiszek

**Akcja**: Użytkownik klika "Zapisz wybrane (X)"

**Przepływ**:

1. Kliknięcie przycisku "Zapisz wybrane"
2. **Walidacja**: Minimum jedna propozycja musi być zaznaczona
3. **Przygotowanie danych**:
   - Iteracja po `selectedIds`
   - Dla każdej zaznaczonej propozycji:
     - Sprawdzenie czy edytowana (`editedProposals.has(index)`)
     - Przygotowanie `FlashcardCreateCommand`:
       - `front`: Edytowana wartość lub oryginalna
       - `back`: Edytowana wartość lub oryginalna
       - `source`: 'ai-edited' jeśli edytowana, 'ai-full' jeśli nie
       - `generation_id`: ID z `generationData`
4. **UI update**:
   - `isSaving` → true
   - Przycisk disabled z spinnerem
5. **API call**: `POST /api/flashcards` z batch
6. **Success**:
   - Toast: "Zapisano {count} fiszek"
   - Reset widoku: `phase` → 'input', wyczyszczenie formularza
   - Użytkownik może wygenerować kolejne
7. **Error**:
   - Toast z komunikatem błędu
   - `isSaving` → false
   - Użytkownik może spróbować ponownie

## 9. Warunki i walidacja

### 9.1. Walidacja formularza GenerateForm

**Komponent**: `GenerateForm`

**Warunki**:

1. **Długość tekstu źródłowego**
   - **Minimum**: 1000 znaków (po trim)
   - **Maximum**: 10000 znaków (po trim)
   - **Sprawdzanie**: Real-time przy onChange
   - **Efekt UI**:
     - Licznik znaków czerwony gdy invalid
     - Komunikat błędu pod textarea
     - Przycisk disabled

2. **Tekst niepusty**
   - **Warunek**: `sourceText.trim().length > 0`
   - **Efekt UI**: Przycisk disabled

3. **Brak ładowania**
   - **Warunek**: `!isLoading`
   - **Efekt UI**: Przycisk i textarea disabled podczas ładowania

**Implementacja walidacji**:

```typescript
const validateSourceText = (text: string): ValidationResult => {
  const trimmed = text.trim();
  const length = trimmed.length;

  if (length === 0) {
    return {
      isValid: false,
      error: "Wprowadź tekst źródłowy",
    };
  }

  if (length < 1000) {
    return {
      isValid: false,
      error: `Tekst musi mieć minimum 1000 znaków (aktualnie: ${length})`,
    };
  }

  if (length > 10000) {
    return {
      isValid: false,
      error: `Tekst może mieć maksymalnie 10000 znaków (aktualnie: ${length})`,
    };
  }

  return {
    isValid: true,
    error: null,
  };
};
```

### 9.2. Walidacja propozycji ProposalCard

**Komponent**: `ProposalCard`

**Warunki**:

1. **Długość front (pytanie)**
   - **Maximum**: 200 znaków
   - **Sprawdzanie**: HTML attribute `maxLength={200}`
   - **Efekt UI**: Licznik znaków "X / 200"

2. **Długość back (odpowiedź)**
   - **Maximum**: 500 znaków
   - **Sprawdzanie**: HTML attribute `maxLength={500}`
   - **Efekt UI**: Licznik znaków "X / 500"

3. **Pola niepuste**
   - **Warunek**: `front.trim().length > 0 && back.trim().length > 0`
   - **Sprawdzanie**: Na poziomie API (backend)
   - **Efekt UI**: Błąd API wyświetlony jako toast

**Uwaga**: Walidacja max length jest enforced przez HTML attribute, więc użytkownik nie może wprowadzić więcej znaków.

### 9.3. Walidacja zapisu ProposalList

**Komponent**: `ProposalList`

**Warunki**:

1. **Minimum jedna zaznaczona propozycja**
   - **Warunek**: `selectedIds.size > 0`
   - **Efekt UI**: Przycisk "Zapisz wybrane" disabled

2. **Wszystkie edytowane propozycje valid**
   - **Warunek**: Sprawdzane przed wysłaniem do API
   - **Efekt UI**: Błąd wyświetlony jako toast jeśli invalid

3. **Brak aktywnego zapisywania**
   - **Warunek**: `!isSaving`
   - **Efekt UI**: Przycisk disabled z spinnerem

**Implementacja sprawdzania przed zapisem**:

```typescript
const validateBeforeSave = (): boolean => {
  // Sprawdź czy są zaznaczone
  if (selectedIds.size === 0) {
    toast.error("Zaznacz przynajmniej jedną fiszkę");
    return false;
  }

  // Sprawdź długości edytowanych pól
  for (const [index, edit] of editedProposals.entries()) {
    if (!selectedIds.has(index)) continue; // Pomiń niezaznaczone

    if (edit.front && edit.front.length > 200) {
      toast.error(`Przód fiszki ${index + 1} przekracza 200 znaków`);
      return false;
    }

    if (edit.back && edit.back.length > 500) {
      toast.error(`Tył fiszki ${index + 1} przekracza 500 znaków`);
      return false;
    }
  }

  return true;
};
```

### 9.4. Walidacja po stronie API

**Backend**: Plik `src/pages/api/generations/index.ts` i `src/pages/api/flashcards/index.ts`

Schematy Zod już istnieją:

- `generationCreateSchema` - walidacja source_text (1000-10000 chars)
- `flashcardSchema` - walidacja front (max 200), back (max 500)

Backend automatycznie zwraca odpowiednie błędy (422, 400) przy nieprawidłowych danych.

## 10. Obsługa błędów

### 10.1. Błędy walidacji (422 Unprocessable Entity)

**Scenariusz**: Tekst źródłowy poza zakresem 1000-10000 znaków

**Odpowiedź API**:

```json
{
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "message": "Source text must be at least 1000 characters",
    "details": {
      "field": "source_text",
      "min": 1000,
      "actual": 543
    }
  }
}
```

**Obsługa w UI**:

```typescript
if (error.code === "UNPROCESSABLE_ENTITY") {
  toast.error(error.message);
  // Opcjonalnie: Focus na textarea
}
```

**Komunikat dla użytkownika**:

- "Tekst musi mieć minimum 1000 znaków"
- "Tekst może mieć maksymalnie 10000 znaków"

### 10.2. Błąd duplikatu (409 Conflict)

**Scenariusz**: Użytkownik próbuje wygenerować fiszki z tego samego tekstu, który już był przetworzony

**Odpowiedź API**:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Generation already exists for this source text",
    "details": {
      "existing_generation_id": 42
    }
  }
}
```

**Obsługa w UI**:

```typescript
if (error.code === 'CONFLICT') {
  const generationId = error.details?.existing_generation_id;

  toast.error(
    <div>
      <p>Ta treść została już wygenerowana.</p>
      {generationId && (
        <a
          href={`/generations/${generationId}`}
          className="underline"
        >
          Zobacz istniejącą generację
        </a>
      )}
    </div>,
    { duration: 10000 }
  );
}
```

**Komunikat dla użytkownika**:

- "Ta treść została już wygenerowana. Zobacz istniejącą generację [link]"

### 10.3. Błąd LLM (500 Internal Server Error)

**Scenariusz**: Model LLM zwrócił błąd lub nie udało się sparsować odpowiedzi

**Odpowiedź API**:

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Failed to generate flashcards"
  }
}
```

**Obsługa w UI**:

```typescript
if (error.code === "INTERNAL_SERVER_ERROR") {
  toast.error("Nie udało się wygenerować fiszek. Spróbuj ponownie za chwilę.", {
    action: {
      label: "Spróbuj ponownie",
      onClick: () => handleRetry(),
    },
  });
}
```

**Komunikat dla użytkownika**:

- "Nie udało się wygenerować fiszek. Spróbuj ponownie."
- Przycisk "Spróbuj ponownie" w toast

### 10.4. Niedostępność serwisu (503 Service Unavailable)

**Scenariusz**: LLM API niedostępne lub timeout

**Odpowiedź API**:

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "AI service temporarily unavailable"
  }
}
```

**Obsługa w UI**:

```typescript
if (error.code === "SERVICE_UNAVAILABLE") {
  toast.error("Serwis AI jest chwilowo niedostępny. Spróbuj ponownie za kilka minut.", { duration: 8000 });
}
```

**Komunikat dla użytkownika**:

- "Serwis AI jest chwilowo niedostępny. Spróbuj ponownie za kilka minut."

### 10.5. Błąd sieciowy (Network Error)

**Scenariusz**: Brak połączenia internetowego lub timeout

**Wykrywanie**:

```typescript
catch (error) {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    // Network error
  }
}
```

**Obsługa w UI**:

```typescript
toast.error("Sprawdź połączenie internetowe i spróbuj ponownie.", {
  action: {
    label: "Spróbuj ponownie",
    onClick: () => handleRetry(),
  },
});
```

**Komunikat dla użytkownika**:

- "Sprawdź połączenie internetowe i spróbuj ponownie."

### 10.6. Błąd zapisu fiszek (409 Conflict przy zapisie)

**Scenariusz**: Jedna z zapisywanych fiszek już istnieje w bazie

**Odpowiedź API**:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Duplicate flashcard exists with ID: 123 for front: \"What is TypeScript?\""
  }
}
```

**Obsługa w UI**:

```typescript
toast.error("Jedna lub więcej fiszek już istnieje w Twojej kolekcji. Usuń duplikaty i spróbuj ponownie.");
```

**Komunikat dla użytkownika**:

- "Jedna lub więcej fiszek już istnieje w Twojej kolekcji."

### 10.7. Centralna funkcja obsługi błędów

**Plik**: `src/lib/utils/errorHandlers.ts`

```typescript
import { toast } from 'sonner';
import type { ApiError } from '../api/generations';

export function handleGenerateError(error: ApiError): void {
  switch (error.code) {
    case 'UNPROCESSABLE_ENTITY':
      toast.error(error.message);
      break;

    case 'CONFLICT': {
      const generationId = error.details?.existing_generation_id;
      if (generationId) {
        toast.error(
          <div className="flex flex-col gap-2">
            <p>Ta treść została już wygenerowana.</p>
            <a
              href={`/generations/${generationId}`}
              className="text-primary underline text-sm"
            >
              Zobacz istniejącą generację →
            </a>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.error('Ta treść została już wygenerowana.');
      }
      break;
    }

    case 'SERVICE_UNAVAILABLE':
      toast.error(
        'Serwis AI jest chwilowo niedostępny. Spróbuj ponownie za kilka minut.',
        { duration: 8000 }
      );
      break;

    case 'INTERNAL_SERVER_ERROR':
      toast.error('Nie udało się wygenerować fiszek. Spróbuj ponownie.', {
        action: {
          label: 'Odśwież',
          onClick: () => window.location.reload(),
        },
      });
      break;

    case 'NETWORK_ERROR':
      toast.error('Sprawdź połączenie internetowe i spróbuj ponownie.');
      break;

    default:
      toast.error('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
  }
}

export function handleSaveError(error: ApiError): void {
  switch (error.code) {
    case 'CONFLICT':
      toast.error(
        'Jedna lub więcej fiszek już istnieje w Twojej kolekcji.'
      );
      break;

    case 'UNPROCESSABLE_ENTITY':
      toast.error(error.message);
      break;

    case 'NETWORK_ERROR':
      toast.error('Sprawdź połączenie internetowe i spróbuj ponownie.');
      break;

    default:
      toast.error('Nie udało się zapisać fiszek. Spróbuj ponownie.');
  }
}
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

**Cel**: Utworzenie wszystkich wymaganych plików i folderów

**Akcje**:

1. Utwórz `src/pages/generate.astro` - strona główna widoku
2. Utwórz folder `src/components/generate/` dla komponentów React
3. Utwórz `src/lib/viewModels/generateView.types.ts` - typy ViewModel
4. Utwórz `src/lib/api/generations.ts` - wrapper API
5. Utwórz `src/lib/utils/errorHandlers.ts` - obsługa błędów
6. Utwórz `src/lib/hooks/useGenerateFlashcards.ts` - custom hook (opcjonalny)

**Pliki do utworzenia**:

```
src/
├── pages/
│   └── generate.astro
├── components/
│   └── generate/
│       ├── GenerateView.tsx
│       ├── GenerateForm.tsx
│       ├── CharacterCounter.tsx
│       ├── LoadingIndicator.tsx
│       ├── ProposalSection.tsx
│       ├── ProposalList.tsx
│       └── ProposalCard.tsx
├── lib/
│   ├── viewModels/
│   │   └── generateView.types.ts
│   ├── api/
│   │   └── generations.ts
│   ├── utils/
│   │   └── errorHandlers.ts
│   └── hooks/
│       └── useGenerateFlashcards.ts (opcjonalny)
```

### Krok 2: Implementacja typów

**Cel**: Zdefiniowanie wszystkich typów TypeScript wymaganych dla widoku

**Akcje**:

1. Otwórz `src/lib/viewModels/generateView.types.ts`
2. Zdefiniuj wszystkie interfejsy zgodnie z sekcją "5. Typy":
   - `GenerateViewState`
   - `GenerationData`
   - `GenerateViewError`
   - `GenerateFormState`
   - `ProposalListState`
   - `ProposalEdit`
   - Wszystkie Props interfaces

**Weryfikacja**: TypeScript nie zgłasza błędów kompilacji

### Krok 3: Implementacja API client

**Cel**: Utworzenie funkcji do komunikacji z backend API

**Akcje**:

1. Otwórz `src/lib/api/generations.ts`
2. Zaimplementuj:
   - Klasę `ApiError`
   - Funkcję `generateFlashcardsFromText()`
   - Funkcję `saveAcceptedFlashcards()`
3. Otwórz `src/lib/utils/errorHandlers.ts`
4. Zaimplementuj:
   - `handleGenerateError()`
   - `handleSaveError()`

**Weryfikacja**: Funkcje kompilują się bez błędów

### Krok 4: Implementacja komponentów prezentacyjnych

**Cel**: Utworzenie komponentów "głupich" (presentational)

**Kolejność implementacji**:

1. **CharacterCounter.tsx**
   - Najprostszy komponent, bez logiki
   - Props: `current`, `min`, `max`, `isValid`
   - Wyświetla licznik i status

2. **LoadingIndicator.tsx**
   - Prosty komponent z spinnerem
   - Props: `text`, `subtext` (opcjonalne)
   - Użyj ikony `Loader2` z `lucide-react`

3. **ProposalCard.tsx**
   - Komponent pojedynczej karty propozycji
   - Props: zgodne z `ProposalCardProps`
   - Zawiera: Checkbox, Input (front), Textarea (back), Badge "AI"
   - Obsługa zdarzeń: `onToggleSelect`, `onEdit`

**Weryfikacja**: Komponenty renderują się poprawnie w Storybook lub izolacji

### Krok 5: Implementacja GenerateForm

**Cel**: Formularz do wprowadzania tekstu źródłowego

**Akcje**:

1. Otwórz `src/components/generate/GenerateForm.tsx`
2. Zaimplementuj:
   - Stan: `sourceText`, `charCount`, `isValid`, `validationError`
   - Funkcję walidacji `validateSourceText()`
   - Handler `handleChange()` - update stanu + walidacja
   - Handler `handleSubmit()` - wywołanie `onGenerate` jeśli valid
   - Handler `handleKeyDown()` - obsługa Ctrl+Enter
3. Użyj komponentów shadcn/ui: `Label`, `Textarea`, `Button`
4. Zintegruj `CharacterCounter`

**Weryfikacja**:

- Licznik znaków aktualizuje się real-time
- Walidacja działa poprawnie (1000-10000)
- Przycisk disabled/enabled odpowiednio
- Ctrl+Enter działa

### Krok 6: Implementacja ProposalList

**Cel**: Lista propozycji z kontrolkami

**Akcje**:

1. Otwórz `src/components/generate/ProposalList.tsx`
2. Zaimplementuj:
   - Stan: `selectedIds` (Set), `editedProposals` (Map), `isSaving`
   - Inicjalizacja: Domyślnie wszystkie zaznaczone
   - Handlery: `handleSelectAll`, `handleDeselectAll`, `handleToggleSelect`, `handleEdit`
   - Funkcję `handleSave()`:
     - Walidacja przed zapisem
     - Przygotowanie `FlashcardCreateCommand[]`
     - Wywołanie `onSave()`
     - Obsługa success/error
3. Renderuj listę `ProposalCard` z odpowiednimi propsami
4. Dodaj kontrolki zaznaczania i licznik
5. Dodaj przycisk "Zapisz wybrane"

**Weryfikacja**:

- Zaznaczanie/odznaczanie działa
- Edycja propozycji zapisuje się w stanie
- Licznik aktualizuje się
- Przycisk zapisu disabled gdy brak zaznaczonych

### Krok 7: Implementacja ProposalSection

**Cel**: Wrapper dla sekcji propozycji

**Akcje**:

1. Otwórz `src/components/generate/ProposalSection.tsx`
2. Zaimplementuj:
   - Prosty komponent wrapper
   - Header z tytułem i opisem
   - Renderowanie `ProposalList` z propsami

**Weryfikacja**: Sekcja renderuje się poprawnie z ProposaList

### Krok 8: Implementacja GenerateView (główny kontener)

**Cel**: Orkiestracja całego widoku

**Akcje**:

1. Otwórz `src/components/generate/GenerateView.tsx`
2. Zaimplementuj:
   - Stan: `viewState` (phase, generationData, isLoading, error)
   - Funkcję `handleGenerate()`:
     - Update phase → 'loading'
     - Wywołanie `generateFlashcardsFromText()`
     - Success: Update phase → 'reviewing', zapisanie danych
     - Error: Update phase → 'input', wyświetlenie błędu
   - Funkcję `handleSave()`:
     - Update phase → 'saving'
     - Wywołanie `saveAcceptedFlashcards()`
     - Success: Toast, reset widoku
     - Error: Wyświetlenie błędu
   - Funkcję `handleReset()`:
     - Reset stanu do początkowego
3. Renderowanie warunkowe:
   - `GenerateForm` zawsze widoczny (disabled gdy loading)
   - `LoadingIndicator` gdy phase === 'loading'
   - `ProposalSection` gdy phase === 'reviewing' lub 'saving'

**Weryfikacja**:

- Cały flow działa: input → loading → reviewing → saving → reset
- Błędy wyświetlają się poprawnie

### Krok 9: Utworzenie strony Astro

**Cel**: Strona `/generate` w Astro

**Akcje**:

1. Otwórz `src/pages/generate.astro`
2. Zaimplementuj:

```astro
---
import Layout from "../layouts/Layout.astro";
import GenerateView from "../components/generate/GenerateView";

// Placeholder: Sprawdzenie auth (middleware)
// W przyszłości: const user = Astro.locals.user;
---

<Layout title="Generuj fiszki - 10x cards">
  <GenerateView client:load />
</Layout>
```

**Weryfikacja**: Strona renderuje się, komponent React hydratuje

### Krok 10: Dodanie nagłówka (DashboardHeader)

**Cel**: Dodanie wspólnego nagłówka dla chronionych widoków

**Akcje**:

1. Utwórz `src/components/layout/DashboardHeader.tsx` (jeśli nie istnieje)
2. Zaimplementuj:
   - Logo (link do `/dashboard`)
   - Dark mode toggle (opcjonalny w MVP)
   - User dropdown z "Wyloguj się"
3. Dodaj DashboardHeader do `Layout.astro` lub bezpośrednio w `generate.astro`

**Weryfikacja**: Header wyświetla się, logo klika do dashboard

### Krok 11: Stylowanie i responsywność

**Cel**: Dopracowanie wyglądu i responsywności

**Akcje**:

1. Dodaj Tailwind classes zgodnie z design system
2. Sprawdź kontrast kolorów (WCAG AA)
3. Dodaj dark mode support (jeśli zaimplementowany)
4. Opcjonalnie: Responsywność dla mobile (poza MVP)

**Weryfikacja**:

- Wygląd zgodny z mockupami
- Kontrast OK
- Animacje smooth

### Krok 12: Dostępność (a11y)

**Cel**: Zapewnienie dostępności widoku

**Akcje**:

1. Dodaj ARIA labels:
   - `aria-label` dla checkboxów
   - `aria-describedby` dla liczników znaków
   - `aria-live` dla licznika (polite)
   - `aria-invalid` dla invalid textarea
2. Sprawdź keyboard navigation:
   - Tab przez wszystkie interaktywne elementy
   - Enter submit formularza
   - Ctrl+Enter quick submit
   - Space toggle checkbox
3. Sprawdź focus styles:
   - Widoczny outline na focus
   - Focus trap nie potrzebny (brak modali)

**Weryfikacja**:

- Przejście przez widok tylko z klawiatury
- Screen reader czyta wszystko poprawnie

### Krok 13: Testowanie manualne

**Cel**: Przetestowanie wszystkich scenariuszy

**Testy do wykonania**:

1. **Happy path**:
   - Wprowadź tekst (1000-10000 chars)
   - Wygeneruj fiszki
   - Przejrzyj propozycje
   - Edytuj kilka propozycji
   - Zapisz wszystkie zaznaczone
   - Sprawdź toast sukcesu
   - Sprawdź reset formularza

2. **Walidacja**:
   - Spróbuj < 1000 chars → przycisk disabled
   - Spróbuj > 10000 chars → przycisk disabled
   - Sprawdź licznik czerwony/zielony

3. **Edycja**:
   - Edytuj propozycję front
   - Edytuj propozycję back
   - Sprawdź liczniki znaków
   - Sprawdź że nie można przekroczyć max length

4. **Zaznaczanie**:
   - Odznacz wszystkie → przycisk zapisu disabled
   - Zaznacz wybrane → licznik aktualizuje się
   - Zaznacz wszystkie → wszystkie checked

5. **Błędy**:
   - Symuluj duplikat (ten sam tekst dwa razy)
   - Sprawdź toast z linkiem do generacji
   - Symuluj błąd sieciowy (offline)
   - Sprawdź komunikat błędu

6. **Loading states**:
   - Sprawdź spinner podczas generowania
   - Sprawdź disabled form podczas loading
   - Sprawdź spinner w przycisku zapisu

**Weryfikacja**: Wszystkie scenariusze działają poprawnie

### Krok 14: Optymalizacja i refaktoryzacja

**Cel**: Optymalizacja wydajności i czystości kodu

**Akcje**:

1. Dodaj `React.memo()` dla ProposalCard (jeśli lista długa)
2. Użyj `useCallback()` dla handlerów przekazywanych do dzieci
3. Sprawdź czy nie ma zbędnych re-renderów
4. Wydziel powtarzające się fragmenty do helperów
5. Dodaj komentarze JSDoc do funkcji

**Weryfikacja**: Kod czysty, wydajność OK

### Krok 15: Integracja z resztą aplikacji

**Cel**: Połączenie widoku z Dashboard i nawigacją

**Akcje**:

1. Dodaj link w Dashboard do `/generate`
2. Sprawdź czy middleware chroni widok (redirect do /login)
3. Sprawdź czy DashboardHeader logo wraca do dashboard
4. Opcjonalnie: Dodaj breadcrumbs (poza MVP)

**Weryfikacja**: Nawigacja działa w obie strony

### Krok 16: Dokumentacja

**Cel**: Dokumentacja kodu dla przyszłych developerów

**Akcje**:

1. Dodaj README.md w `src/components/generate/`:
   - Opis widoku
   - Diagram komponentów
   - Instrukcje dla developerów
2. Dodaj JSDoc comments do głównych funkcji
3. Zaktualizuj główne README projektu

**Weryfikacja**: Nowy developer może zrozumieć kod

### Krok 17: Final review i cleanup

**Cel**: Ostateczny przegląd przed merge

**Akcje**:

1. Przejrzyj wszystkie TODO w kodzie
2. Usuń console.log i debug code
3. Sprawdź linter (ESLint)
4. Sprawdź TypeScript errors
5. Commit z opisowym message

**Weryfikacja**: Brak warningów, kod gotowy do merge

---

## Podsumowanie

Ten plan implementacji obejmuje wszystkie aspekty widoku Generowania Fiszek, od struktury komponentów, przez zarządzanie stanem, integrację z API, po dostępność i obsługę błędów. Implementacja powinna być wykonywana krok po kroku, z weryfikacją każdego etapu przed przejściem do kolejnego.

Kluczowe punkty do zapamiętania:

- Desktop-first approach (mobile poza MVP)
- Real-time walidacja i feedback dla użytkownika
- Obsługa wszystkich scenariuszy błędów z informa­cyjnymi komunikatami
- Dostępność (a11y) jako priorytet
- Kod modularny i testowalny
- TypeScript strict mode

Szacowany czas implementacji: **8-12 godzin** dla doświadczonego frontend developera.
