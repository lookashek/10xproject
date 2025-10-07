# Plan implementacji widoku Listy Fiszek

## 1. Przegląd

Widok Listy Fiszek to centralny punkt zarządzania wszystkimi fiszkami użytkownika. Umożliwia przeglądanie fiszek w formie interaktywnych kart z efektem flip, filtrowanie według źródła (AI-full, AI-edited, manual), ręczne tworzenie nowych fiszek, edycję istniejących oraz ich usuwanie. Widok wspiera paginację dla dużych zbiorów danych i zapewnia intuicyjny interfejs z animacjami oraz feedback dla użytkownika.

**Główne funkcjonalności:**
- Wyświetlanie fiszek w responsywnym gridzie 3-kolumnowym z efektem flip
- Filtrowanie fiszek według źródła pochodzenia
- Ręczne tworzenie nowych fiszek poprzez dialog
- Edycja istniejących fiszek z automatyczną zmianą źródła
- Usuwanie fiszek z potwierdzeniem
- Paginacja dla zestawów większych niż 50 fiszek
- Empty state z call-to-action dla nowych użytkowników
- Loading states i skeleton screens

## 2. Routing widoku

**Ścieżka:** `/flashcards`

**Typ:** Chroniony widok (wymaga uwierzytelnienia użytkownika)

**Implementacja:** Astro page (`src/pages/flashcards.astro`) z React components dla interaktywności

**Query parameters:**
- `page` (number, default: 1) - numer bieżącej strony
- `limit` (number, default: 50) - liczba fiszek na stronę
- `source` (string, optional) - filtr źródła: 'ai-full' | 'ai-edited' | 'manual'

**Przykłady URL:**
- `/flashcards` - pierwsza strona, bez filtrów
- `/flashcards?page=2` - druga strona
- `/flashcards?source=manual` - tylko fiszki ręczne
- `/flashcards?page=2&source=ai-full` - druga strona fiszek AI bez edycji

## 3. Struktura komponentów

```
flashcards.astro (Astro Page)
└── Layout.astro
    └── FlashcardsView (React Component - główny kontener)
        ├── FlashcardToolbar (React)
        │   ├── Button ("Dodaj fiszkę")
        │   └── Select (Filtr źródła)
        │
        ├── FlashcardGrid (React)
        │   ├── FlashcardCard (React) × N
        │   │   ├── Badge (źródło)
        │   │   ├── FlashcardContent (front/back)
        │   │   └── FlashcardActions (edit/delete overlay)
        │   │
        │   └── FlashcardCardSkeleton × 50 (loading state)
        │
        ├── Pagination (React)
        │   ├── Button (Previous)
        │   ├── Button (Page numbers)
        │   └── Button (Next)
        │
        ├── EmptyState (React)
        │   └── Button ("Dodaj pierwszą fiszkę")
        │
        ├── FlashcardDialog (React - shadcn/ui Dialog)
        │   └── FlashcardForm (React)
        │       ├── Input (front)
        │       ├── Textarea (back)
        │       ├── CharacterCounter × 2
        │       └── DialogFooter (Buttons)
        │
        └── DeleteConfirmDialog (React - shadcn/ui AlertDialog)
            └── AlertDialogFooter (Buttons)
```

## 4. Szczegóły komponentów

### 4.1. FlashcardsView (React Component - główny kontener)

**Opis:** 
Główny kontener zarządzający całym widokiem listy fiszek. Odpowiada za:
- Pobieranie danych z API
- Zarządzanie stanem widoku (lista fiszek, loading, błędy)
- Obsługę paginacji i filtrowania
- Koordynację dialogów (create/edit/delete)
- Synchronizację stanu z URL query parameters

**Główne elementy:**
```tsx
<div className="container mx-auto px-4 py-8 max-w-7xl">
  <h1 className="text-3xl font-bold mb-8">Moje fiszki</h1>
  
  <FlashcardToolbar 
    onAddClick={handleOpenCreateDialog}
    sourceFilter={sourceFilter}
    onSourceFilterChange={handleSourceFilterChange}
  />
  
  {isLoading && <FlashcardGridSkeleton />}
  
  {!isLoading && flashcards.length === 0 && (
    <EmptyState onAddClick={handleOpenCreateDialog} />
  )}
  
  {!isLoading && flashcards.length > 0 && (
    <>
      <FlashcardGrid 
        flashcards={flashcards}
        onEditClick={handleOpenEditDialog}
        onDeleteClick={handleOpenDeleteDialog}
      />
      
      {pagination.total_pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.total_pages}
          totalItems={pagination.total}
          onPageChange={handlePageChange}
        />
      )}
    </>
  )}
  
  <FlashcardDialog
    open={dialogState.type === 'create' || dialogState.type === 'edit'}
    mode={dialogState.type}
    flashcard={dialogState.flashcard}
    onClose={handleCloseDialog}
    onSave={handleSaveFlashcard}
    isSaving={isSaving}
  />
  
  <DeleteConfirmDialog
    open={dialogState.type === 'delete'}
    flashcardFront={dialogState.flashcard?.front}
    onClose={handleCloseDialog}
    onConfirm={handleConfirmDelete}
    isDeleting={isDeleting}
  />
</div>
```

**Obsługiwane interakcje:**
- `handleOpenCreateDialog()` - otwiera dialog tworzenia nowej fiszki
- `handleOpenEditDialog(flashcard)` - otwiera dialog edycji fiszki
- `handleOpenDeleteDialog(flashcard)` - otwiera dialog potwierdzenia usunięcia
- `handleCloseDialog()` - zamyka wszystkie dialogi
- `handleSaveFlashcard(data)` - zapisuje nową lub edytowaną fiszkę
- `handleConfirmDelete()` - potwierdza usunięcie fiszki
- `handleSourceFilterChange(source)` - zmienia filtr źródła i resetuje stronę do 1
- `handlePageChange(page)` - zmienia bieżącą stronę

**Obsługiwana walidacja:**
- Brak walidacji na poziomie tego komponentu (delegowana do FlashcardForm)

**Typy:**
- `FlashcardDTO` - pojedyncza fiszka z API
- `FlashcardListResponse` - odpowiedź z listą fiszek i paginacją
- `FlashcardSource` - typ źródła fiszki
- `DialogState` - stan dialogów (utworzony niestandardowy typ)

**Propsy:**
```typescript
interface FlashcardsViewProps {
  initialData: FlashcardListResponse; // dane SSR z Astro
  initialPage: number;
  initialSource?: FlashcardSource;
}
```

### 4.2. FlashcardToolbar (React Component)

**Opis:**
Pasek narzędzi zawierający przycisk dodawania nowej fiszki oraz filtr źródła. Umożliwia użytkownikowi szybkie tworzenie fiszek i filtrowanie widoku.

**Główne elementy:**
```tsx
<div className="flex items-center justify-between mb-6 gap-4">
  <Button 
    onClick={onAddClick}
    variant="default"
    size="default"
  >
    <PlusIcon className="size-4" />
    Dodaj fiszkę
  </Button>
  
  <Select
    value={sourceFilter}
    onValueChange={onSourceFilterChange}
  >
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Filtruj według źródła" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Wszystkie</SelectItem>
      <SelectItem value="ai-full">AI (niezmienione)</SelectItem>
      <SelectItem value="ai-edited">AI (edytowane)</SelectItem>
      <SelectItem value="manual">Ręczne</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Obsługiwane interakcje:**
- Click na przycisk "Dodaj fiszkę" wywołuje `onAddClick`
- Zmiana wartości w Select wywołuje `onSourceFilterChange` z wybraną wartością

**Obsługiwana walidacja:**
- Brak walidacji (tylko przekazywanie zdarzeń)

**Typy:**
- `FlashcardSource | 'all'` - wartość filtra

**Propsy:**
```typescript
interface FlashcardToolbarProps {
  onAddClick: () => void;
  sourceFilter: FlashcardSource | 'all';
  onSourceFilterChange: (source: FlashcardSource | 'all') => void;
}
```

### 4.3. FlashcardGrid (React Component)

**Opis:**
Responsywny grid wyświetlający wszystkie fiszki w układzie 3-kolumnowym. Każda fiszka jest renderowana jako FlashcardCard. Na urządzeniach mobilnych automatycznie dostosowuje się do 1 lub 2 kolumn.

**Główne elementy:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  {flashcards.map((flashcard) => (
    <FlashcardCard
      key={flashcard.id}
      flashcard={flashcard}
      onEditClick={() => onEditClick(flashcard)}
      onDeleteClick={() => onDeleteClick(flashcard)}
    />
  ))}
</div>
```

**Obsługiwane interakcje:**
- Przekazuje zdarzenia edit/delete do rodzica dla każdej karty

**Obsługiwana walidacja:**
- Brak walidacji (tylko renderowanie)

**Typy:**
- `FlashcardDTO[]` - tablica fiszek do wyświetlenia

**Propsy:**
```typescript
interface FlashcardGridProps {
  flashcards: FlashcardDTO[];
  onEditClick: (flashcard: FlashcardDTO) => void;
  onDeleteClick: (flashcard: FlashcardDTO) => void;
}
```

### 4.4. FlashcardCard (React Component)

**Opis:**
Interaktywna karta fiszki z efektem flip 3D. Domyślnie pokazuje front fiszki, po kliknięciu obraca się i pokazuje back. Na hover wyświetla overlay z akcjami (edit/delete). Zawiera badge pokazujący źródło fiszki z odpowiednim kolorem.

**Główne elementy:**
```tsx
<div className="perspective-1000 h-[240px]">
  <div 
    className={cn(
      "relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer",
      isFlipped && "rotate-y-180"
    )}
    onClick={handleFlipClick}
    onKeyDown={handleKeyDown}
    tabIndex={0}
    role="button"
    aria-label={`Fiszka: ${flashcard.front}`}
    aria-pressed={isFlipped}
  >
    {/* Front side */}
    <div className="absolute inset-0 backface-hidden">
      <div className="h-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <Badge variant={getSourceBadgeVariant(flashcard.source)}>
            {getSourceLabel(flashcard.source)}
          </Badge>
          <span className="text-xs text-gray-500">Przód</span>
        </div>
        <p className="flex-1 text-base text-gray-900 dark:text-gray-100 break-words">
          {flashcard.front}
        </p>
      </div>
    </div>
    
    {/* Back side */}
    <div className="absolute inset-0 backface-hidden rotate-y-180">
      <div className="h-full p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-md border border-blue-200 dark:border-blue-800 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs text-blue-600 dark:text-blue-400">Tył</span>
        </div>
        <p className="flex-1 text-base text-gray-900 dark:text-gray-100 break-words">
          {flashcard.back}
        </p>
      </div>
    </div>
    
    {/* Hover overlay with actions */}
    <div 
      className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4 z-10"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="secondary"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onEditClick();
        }}
        aria-label="Edytuj fiszkę"
      >
        <PencilIcon className="size-4" />
      </Button>
      <Button
        variant="destructive"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteClick();
        }}
        aria-label="Usuń fiszkę"
      >
        <TrashIcon className="size-4" />
      </Button>
    </div>
  </div>
</div>
```

**Obsługiwane interakcje:**
- Click na kartę - flip między front/back
- Enter/Space na kartę - flip między front/back (keyboard accessibility)
- Click na przycisk Edit - wywołuje `onEditClick` (nie flipuje karty)
- Click na przycisk Delete - wywołuje `onDeleteClick` (nie flipuje karty)
- Hover na kartę - pokazuje overlay z akcjami

**Obsługiwana walidacja:**
- Brak walidacji (tylko wyświetlanie danych)

**Typy:**
- `FlashcardDTO` - dane fiszki

**Propsy:**
```typescript
interface FlashcardCardProps {
  flashcard: FlashcardDTO;
  onEditClick: () => void;
  onDeleteClick: () => void;
}
```

**CSS pomocnicze (do dodania w global.css):**
```css
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}
```

### 4.5. FlashcardCardSkeleton (React Component)

**Opis:**
Placeholder wyświetlany podczas ładowania danych. Imituje wygląd FlashcardCard.

**Główne elementy:**
```tsx
<div className="h-[240px] p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 animate-pulse">
  <div className="flex items-start justify-between mb-4">
    <div className="h-5 w-20 bg-gray-300 dark:bg-gray-600 rounded" />
    <div className="h-4 w-12 bg-gray-300 dark:bg-gray-600 rounded" />
  </div>
  <div className="space-y-3">
    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full" />
    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6" />
    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6" />
  </div>
</div>
```

**Propsy:**
```typescript
// Brak propsów
```

### 4.6. FlashcardGridSkeleton (React Component)

**Opis:**
Grid skeletonów wyświetlanych podczas ładowania.

**Główne elementy:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  {Array.from({ length: 9 }).map((_, index) => (
    <FlashcardCardSkeleton key={index} />
  ))}
</div>
```

### 4.7. EmptyState (React Component)

**Opis:**
Wyświetlany gdy użytkownik nie ma jeszcze żadnych fiszek. Zawiera ilustrację, komunikat oraz przycisk CTA zachęcający do dodania pierwszej fiszki.

**Główne elementy:**
```tsx
<div className="flex flex-col items-center justify-center py-16 px-4">
  <div className="mb-6 text-gray-400 dark:text-gray-600">
    {/* Icon lub ilustracja */}
    <svg className="size-24" /* ... SVG empty state icon ... */ />
  </div>
  
  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
    Brak fiszek
  </h2>
  
  <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
    Nie masz jeszcze żadnych fiszek. Dodaj swoją pierwszą fiszkę ręcznie lub wygeneruj zestaw przy użyciu AI.
  </p>
  
  <div className="flex gap-3">
    <Button onClick={onAddClick} variant="default">
      <PlusIcon className="size-4" />
      Dodaj fiszkę
    </Button>
    <Button asChild variant="outline">
      <a href="/generate">
        <SparklesIcon className="size-4" />
        Generuj z AI
      </a>
    </Button>
  </div>
</div>
```

**Obsługiwane interakcje:**
- Click "Dodaj fiszkę" - wywołuje `onAddClick`
- Click "Generuj z AI" - przekierowanie do `/generate`

**Propsy:**
```typescript
interface EmptyStateProps {
  onAddClick: () => void;
}
```

### 4.8. Pagination (React Component)

**Opis:**
Komponent paginacji wyświetlający przyciski Previous/Next, numery stron oraz informację o całkowitej liczbie fiszek. Inteligentnie skraca listę numerów stron dla dużych zbiorów (pokazuje 1 ... 5 6 7 ... 20).

**Główne elementy:**
```tsx
<div className="flex flex-col items-center gap-4 mt-8">
  <div className="flex items-center gap-2">
    <Button
      variant="outline"
      size="default"
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      aria-label="Poprzednia strona"
    >
      <ChevronLeftIcon className="size-4" />
      Poprzednia
    </Button>
    
    {getPageNumbers().map((pageNum, index) => {
      if (pageNum === '...') {
        return <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>;
      }
      
      const page = Number(pageNum);
      return (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="icon"
          onClick={() => onPageChange(page)}
          aria-label={`Strona ${page}`}
          aria-current={currentPage === page ? "page" : undefined}
        >
          {page}
        </Button>
      );
    })}
    
    <Button
      variant="outline"
      size="default"
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      aria-label="Następna strona"
    >
      Następna
      <ChevronRightIcon className="size-4" />
    </Button>
  </div>
  
  <p className="text-sm text-gray-600 dark:text-gray-400">
    Strona {currentPage} z {totalPages} ({totalItems} {getPluralForm(totalItems, 'fiszka', 'fiszki', 'fiszek')})
  </p>
</div>
```

**Obsługiwane interakcje:**
- Click na Previous/Next - zmienia stronę
- Click na numer strony - przechodzi do danej strony
- Keyboard navigation - Tab między przyciskami, Enter do aktywacji

**Obsługiwana walidacja:**
- Disable Previous na pierwszej stronie
- Disable Next na ostatniej stronie

**Typy:**
- `PaginationMeta` (częściowo) - metadane paginacji

**Propsy:**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}
```

**Logika getPageNumbers():**
```typescript
// Przykład: currentPage=6, totalPages=20
// Wynik: [1, '...', 5, 6, 7, '...', 20]
function getPageNumbers(): (number | string)[] {
  const delta = 1; // ile stron po każdej stronie bieżącej
  const range: (number | string)[] = [];
  
  // Zawsze pokazuj pierwszą stronę
  range.push(1);
  
  // Dodaj ellipsis lub strony przed bieżącą
  if (currentPage - delta > 2) {
    range.push('...');
  }
  
  for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
    range.push(i);
  }
  
  // Dodaj ellipsis lub strony po bieżącej
  if (currentPage + delta < totalPages - 1) {
    range.push('...');
  }
  
  // Zawsze pokazuj ostatnią stronę (jeśli więcej niż 1 strona)
  if (totalPages > 1) {
    range.push(totalPages);
  }
  
  return range;
}
```

### 4.9. FlashcardDialog (React Component - shadcn/ui Dialog)

**Opis:**
Dialog służący zarówno do tworzenia nowych fiszek, jak i edycji istniejących. Zawiera formularz z polami front/back, licznikami znaków oraz przyciskami akcji. Tryb pracy (create/edit) determinowany jest przez props.

**Główne elementy:**
```tsx
<Dialog open={open} onOpenChange={onClose}>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>
        {mode === 'create' ? 'Dodaj nową fiszkę' : 'Edytuj fiszkę'}
      </DialogTitle>
      <DialogDescription>
        {mode === 'create' 
          ? 'Stwórz nową fiszkę ręcznie, wpisując przód i tył.'
          : 'Edytuj treść fiszki. Jeśli fiszka pochodzi z AI, zostanie oznaczona jako edytowana.'}
      </DialogDescription>
    </DialogHeader>
    
    <FlashcardForm
      initialData={flashcard}
      onSubmit={onSave}
      onCancel={onClose}
      isSaving={isSaving}
    />
  </DialogContent>
</Dialog>
```

**Obsługiwane interakcje:**
- Zamknięcie dialogu przez overlay, ESC lub przycisk X - wywołuje `onClose`
- Submit formularza - wywołuje `onSave` z danymi
- Focus trap - focus pozostaje wewnątrz dialogu

**Obsługiwana walidacja:**
- Delegowana do FlashcardForm

**Typy:**
- `FlashcardDTO | null` - dane fiszki do edycji (null przy tworzeniu)

**Propsy:**
```typescript
interface FlashcardDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  flashcard: FlashcardDTO | null;
  onClose: () => void;
  onSave: (data: FlashcardFormData) => Promise<void>;
  isSaving: boolean;
}
```

### 4.10. FlashcardForm (React Component)

**Opis:**
Formularz do wprowadzania/edycji treści fiszki. Zawiera walidację, liczniki znaków, obsługę błędów oraz loading states. Używa React Hook Form + Zod do walidacji.

**Główne elementy:**
```tsx
<form onSubmit={handleSubmit(onSubmitInternal)} className="space-y-6">
  {error && (
    <Alert variant="destructive">
      <AlertCircleIcon className="size-4" />
      <AlertTitle>Błąd</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )}
  
  <div className="space-y-2">
    <Label htmlFor="front">
      Przód fiszki
      <span className="text-destructive ml-1">*</span>
    </Label>
    <Input
      id="front"
      {...register('front')}
      placeholder="Co chcesz zapamiętać?"
      maxLength={200}
      aria-invalid={!!errors.front}
      aria-describedby="front-error front-counter"
    />
    {errors.front && (
      <p id="front-error" className="text-sm text-destructive">
        {errors.front.message}
      </p>
    )}
    <p id="front-counter" className="text-xs text-gray-500 text-right">
      {watchFront.length}/200
    </p>
  </div>
  
  <div className="space-y-2">
    <Label htmlFor="back">
      Tył fiszki
      <span className="text-destructive ml-1">*</span>
    </Label>
    <Textarea
      id="back"
      {...register('back')}
      placeholder="Jaka jest odpowiedź?"
      maxLength={500}
      rows={5}
      aria-invalid={!!errors.back}
      aria-describedby="back-error back-counter"
    />
    {errors.back && (
      <p id="back-error" className="text-sm text-destructive">
        {errors.back.message}
      </p>
    )}
    <p id="back-counter" className="text-xs text-gray-500 text-right">
      {watchBack.length}/500
    </p>
  </div>
  
  <DialogFooter>
    <Button
      type="button"
      variant="outline"
      onClick={onCancel}
      disabled={isSaving}
    >
      Anuluj
    </Button>
    <Button
      type="submit"
      variant="default"
      disabled={isSaving || !isValid}
    >
      {isSaving ? (
        <>
          <LoaderIcon className="size-4 animate-spin" />
          Zapisywanie...
        </>
      ) : (
        'Zapisz'
      )}
    </Button>
  </DialogFooter>
</form>
```

**Obsługiwane interakcje:**
- Wpisywanie tekstu w polach - live validation
- Submit formularza - walidacja i wywołanie `onSubmit`
- Anuluj - wywołanie `onCancel`
- Enter w polu Input - próba submitu
- Tab navigation między polami

**Obsługiwana walidacja:**
Szczegółowa walidacja zgodna z API:

1. **Pole `front`:**
   - Wymagane (nie może być puste)
   - Po trim musi mieć min. 1 znak
   - Max 200 znaków
   - Komunikat: "Przód fiszki jest wymagany" / "Przód fiszki może mieć maksymalnie 200 znaków"

2. **Pole `back`:**
   - Wymagane (nie może być puste)
   - Po trim musi mieć min. 1 znak
   - Max 500 znaków
   - Komunikat: "Tył fiszki jest wymagany" / "Tył fiszki może mieć maksymalnie 500 znaków"

3. **Duplikaty:**
   - Obsługa błędu 409 Conflict z API
   - Wyświetlenie komunikatu: "Taka fiszka już istnieje (ID: {id})"

4. **Submit disabled gdy:**
   - Formularz jest invalid (błędy walidacji)
   - Trwa zapisywanie (`isSaving === true`)

**Typy:**
- `FlashcardFormData` - dane formularza
- `FlashcardDTO | null` - początkowe dane

**Propsy:**
```typescript
interface FlashcardFormProps {
  initialData: FlashcardDTO | null;
  onSubmit: (data: FlashcardFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}
```

### 4.11. DeleteConfirmDialog (React Component - shadcn/ui AlertDialog)

**Opis:**
Dialog potwierdzenia usunięcia fiszki. Wyświetla ostrzeżenie i wymaga potwierdzenia operacji. Pokazuje fragment usuwanej fiszki dla kontekstu.

**Główne elementy:**
```tsx
<AlertDialog open={open} onOpenChange={onClose}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Czy na pewno chcesz usunąć tę fiszkę?</AlertDialogTitle>
      <AlertDialogDescription>
        Ta operacja jest nieodwracalna. Fiszka zostanie trwale usunięta.
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    {flashcardFront && (
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          <strong>Przód:</strong> {flashcardFront}
        </p>
      </div>
    )}
    
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isDeleting}>
        Anuluj
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={onConfirm}
        disabled={isDeleting}
        className={buttonVariants({ variant: 'destructive' })}
      >
        {isDeleting ? (
          <>
            <LoaderIcon className="size-4 animate-spin" />
            Usuwanie...
          </>
        ) : (
          <>
            <TrashIcon className="size-4" />
            Usuń
          </>
        )}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Obsługiwane interakcje:**
- Click "Anuluj" lub zamknięcie dialogu - wywołuje `onClose`
- Click "Usuń" - wywołuje `onConfirm`
- ESC - zamyka dialog

**Obsługiwana walidacja:**
- Brak walidacji (tylko potwierdzenie)

**Typy:**
- `string | undefined` - tekst fiszki do wyświetlenia

**Propsy:**
```typescript
interface DeleteConfirmDialogProps {
  open: boolean;
  flashcardFront?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}
```

## 5. Typy

### 5.1. Istniejące typy (z `src/types.ts`)

**Typy używane bezpośrednio:**

```typescript
// DTO fiszki zwracane przez API
export type FlashcardDTO = Omit<FlashcardEntity, 'user_id'>;
// Pola: id, front, back, source, generation_id, created_at, updated_at

// Źródło fiszki
export type FlashcardSource = 'ai-full' | 'ai-edited' | 'manual';

// Odpowiedź listy fiszek z paginacją
export type FlashcardListResponse = PaginatedResponse<FlashcardDTO>;
// Pola: { data: FlashcardDTO[], pagination: PaginationMeta }

// Metadane paginacji
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

// Command do tworzenia fiszki
export type FlashcardCreateCommand = {
  front: string;
  back: string;
  source: FlashcardSource;
  generation_id?: number | null;
};

// Command do aktualizacji fiszki
export type FlashcardUpdateCommand = {
  front?: string;
  back?: string;
};

// Query parameters dla listowania
export type FlashcardListQuery = {
  page?: number;
  limit?: number;
  source?: FlashcardSource;
  search?: string;
};

// Standardowy błąd API
export type ApiError = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetail;
  };
};
```

### 5.2. Nowe typy do stworzenia (ViewModels)

**Typy specyficzne dla widoku:**

```typescript
/**
 * Stan dialogu w FlashcardsView
 * Określa, który dialog jest otwarty i z jakimi danymi
 */
export type DialogState = 
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; flashcard: FlashcardDTO }
  | { type: 'delete'; flashcard: FlashcardDTO };

/**
 * Dane formularza fiszki
 * Używane przez FlashcardForm do walidacji i submitu
 */
export type FlashcardFormData = {
  front: string;
  back: string;
};

/**
 * Rozszerzony filtr źródła z opcją "all"
 * Używany w FlashcardToolbar
 */
export type SourceFilterValue = FlashcardSource | 'all';

/**
 * Props dla komponentów toast notifications
 */
export type ToastMessage = {
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
};

/**
 * Stan ładowania dla różnych operacji
 */
export type LoadingState = {
  isLoading: boolean; // ładowanie listy
  isSaving: boolean;  // zapisywanie create/edit
  isDeleting: boolean; // usuwanie fiszki
};

/**
 * Stan błędu
 */
export type ErrorState = {
  message: string;
  code?: ApiErrorCode;
} | null;
```

### 5.3. Schematy walidacji Zod

**Schema dla formularza fiszki:**

```typescript
import { z } from 'zod';

export const flashcardFormSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1, { message: 'Przód fiszki jest wymagany' })
    .max(200, { message: 'Przód fiszki może mieć maksymalnie 200 znaków' }),
  back: z
    .string()
    .trim()
    .min(1, { message: 'Tył fiszki jest wymagany' })
    .max(500, { message: 'Tył fiszki może mieć maksymalnie 500 znaków' }),
});

export type FlashcardFormData = z.infer<typeof flashcardFormSchema>;
```

## 6. Zarządzanie stanem

### 6.1. Stan lokalny komponentów

**FlashcardsView (główny kontener):**
```typescript
const [flashcards, setFlashcards] = useState<FlashcardDTO[]>(initialData.data);
const [pagination, setPagination] = useState<PaginationMeta>(initialData.pagination);
const [isLoading, setIsLoading] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
const [error, setError] = useState<ErrorState>(null);
const [dialogState, setDialogState] = useState<DialogState>({ type: 'closed' });

// Derived from URL query params
const [currentPage, setCurrentPage] = useState(initialPage);
const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>(initialSource ?? 'all');
```

**FlashcardCard:**
```typescript
const [isFlipped, setIsFlipped] = useState(false);
```

**FlashcardForm:**
```typescript
// React Hook Form state
const form = useForm<FlashcardFormData>({
  resolver: zodResolver(flashcardFormSchema),
  defaultValues: {
    front: initialData?.front ?? '',
    back: initialData?.back ?? '',
  },
});

const [error, setError] = useState<string | null>(null);
```

### 6.2. Synchronizacja z URL (Query Parameters)

**Podejście:**
- Używamy React Router lub własnego hooka `useSearchParams` (dla Astro)
- Stan `currentPage` i `sourceFilter` synchronizowany z URL
- Zmiana filtra/strony → update URL → fetch nowych danych

**Przykładowa implementacja hooka:**

```typescript
function useFlashcardQueryParams() {
  const navigate = useNavigate(); // lub własna implementacja
  const searchParams = new URLSearchParams(window.location.search);
  
  const page = Number(searchParams.get('page')) || 1;
  const source = (searchParams.get('source') as FlashcardSource) || undefined;
  
  const updateQueryParams = useCallback((newParams: { page?: number; source?: SourceFilterValue }) => {
    const params = new URLSearchParams(window.location.search);
    
    if (newParams.page !== undefined) {
      params.set('page', String(newParams.page));
    }
    
    if (newParams.source !== undefined) {
      if (newParams.source === 'all') {
        params.delete('source');
      } else {
        params.set('source', newParams.source);
      }
    }
    
    navigate(`/flashcards?${params.toString()}`, { replace: true });
  }, [navigate]);
  
  return { page, source, updateQueryParams };
}
```

### 6.3. Custom Hook: useFlashcardList

**Cel:**
Enkapsulacja logiki zarządzania listą fiszek, CRUD operacji i komunikacji z API.

**Implementacja:**

```typescript
function useFlashcardList(initialData: FlashcardListResponse, page: number, source?: FlashcardSource) {
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>(initialData.data);
  const [pagination, setPagination] = useState<PaginationMeta>(initialData.pagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState>(null);
  
  // Fetch flashcards
  const fetchFlashcards = useCallback(async (page: number, source?: FlashcardSource) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '50',
        ...(source && source !== 'all' && { source }),
      });
      
      const response = await fetch(`/api/flashcards?${query}`);
      
      if (!response.ok) {
        throw new Error('Nie udało się pobrać fiszek');
      }
      
      const data: FlashcardListResponse = await response.json();
      setFlashcards(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Wystąpił nieznany błąd',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Create flashcard
  const createFlashcard = useCallback(async (data: FlashcardFormData): Promise<void> => {
    const response = await fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        front: data.front,
        back: data.back,
        source: 'manual',
      } as FlashcardCreateCommand),
    });
    
    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error.message);
    }
    
    // Refresh list
    await fetchFlashcards(page, source);
  }, [fetchFlashcards, page, source]);
  
  // Update flashcard
  const updateFlashcard = useCallback(async (id: number, data: FlashcardFormData): Promise<void> => {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data as FlashcardUpdateCommand),
    });
    
    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error.message);
    }
    
    // Update local state optimistically
    const updatedFlashcard: FlashcardDTO = await response.json();
    setFlashcards((prev) =>
      prev.map((fc) => (fc.id === id ? updatedFlashcard : fc))
    );
  }, []);
  
  // Delete flashcard
  const deleteFlashcard = useCallback(async (id: number): Promise<void> => {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: 'DELETE',
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
```

### 6.4. Toast Notifications

**Podejście:**
- Używamy shadcn/ui Toast component (Sonner lub własny)
- Toast wyświetlany po operacjach CRUD:
  - Success: "Fiszka została dodana", "Fiszka została zaktualizowana", "Fiszka została usunięta"
  - Error: komunikat błędu z API

**Przykład użycia:**
```typescript
import { toast } from '@/components/ui/use-toast'; // lub sonner

// Po sukcesie
toast({
  title: 'Sukces',
  description: 'Fiszka została dodana',
  variant: 'default',
});

// Po błędzie
toast({
  title: 'Błąd',
  description: error.message,
  variant: 'destructive',
});
```

## 7. Integracja API

### 7.1. Lista fiszek (GET /api/flashcards)

**Request:**
```typescript
GET /api/flashcards?page=1&limit=50&source=manual

// Typ query params
type ListFlashcardsQuery = {
  page?: number;      // default: 1
  limit?: number;     // default: 50, max: 100
  source?: FlashcardSource; // optional filter
  search?: string;    // optional, not implemented in MVP
};
```

**Response 200 OK:**
```typescript
{
  "data": FlashcardDTO[],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "total_pages": 3
  }
}

// Typ response
type ListFlashcardsResponse = FlashcardListResponse;
```

**Error Responses:**
- 400 Bad Request: Invalid query parameters
- 401 Unauthorized: Brak autoryzacji (gdy auth będzie wdrożony)
- 500 Internal Server Error: Błąd serwera

**Użycie w komponencie:**
```typescript
const fetchFlashcards = async (page: number, source?: FlashcardSource) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: '50',
  });
  
  if (source && source !== 'all') {
    params.append('source', source);
  }
  
  const response = await fetch(`/api/flashcards?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Nie udało się pobrać fiszek');
  }
  
  const data: FlashcardListResponse = await response.json();
  return data;
};
```

### 7.2. Tworzenie fiszki (POST /api/flashcards)

**Request:**
```typescript
POST /api/flashcards
Content-Type: application/json

{
  "front": "Co to jest TypeScript?",
  "back": "Typowany nadzbiór JavaScriptu",
  "source": "manual"
}

// Typ request body
type CreateFlashcardRequest = FlashcardCreateCommand;
```

**Response 201 Created:**
```typescript
{
  "data": [
    {
      "id": 124,
      "front": "Co to jest TypeScript?",
      "back": "Typowany nadzbiór JavaScriptu",
      "source": "manual",
      "generation_id": null,
      "created_at": "2025-10-06T11:00:00Z",
      "updated_at": "2025-10-06T11:00:00Z"
    }
  ]
}

// Typ response
type CreateFlashcardResponse = { data: FlashcardDTO[] };
```

**Error Responses:**
- 400 Bad Request: Invalid request body
- 409 Conflict: Duplicate flashcard (same front and back)
- 422 Unprocessable Entity: Validation error (max length exceeded)

**Użycie w komponencie:**
```typescript
const createFlashcard = async (data: FlashcardFormData) => {
  const response = await fetch('/api/flashcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      front: data.front,
      back: data.back,
      source: 'manual',
    } as FlashcardCreateCommand),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: { data: FlashcardDTO[] } = await response.json();
  return result.data[0];
};
```

### 7.3. Aktualizacja fiszki (PUT /api/flashcards/{id})

**Request:**
```typescript
PUT /api/flashcards/123
Content-Type: application/json

{
  "front": "Co to jest TypeScript? (Zaktualizowane)",
  "back": "Silnie typowany język programowania oparty na JavaScripcie"
}

// Typ request body
type UpdateFlashcardRequest = FlashcardUpdateCommand;
```

**Response 200 OK:**
```typescript
{
  "id": 123,
  "front": "Co to jest TypeScript? (Zaktualizowane)",
  "back": "Silnie typowany język programowania oparty na JavaScripcie",
  "source": "ai-edited", // zmienione automatycznie z "ai-full"
  "generation_id": 45,
  "created_at": "2025-10-06T10:00:00Z",
  "updated_at": "2025-10-06T11:30:00Z"
}

// Typ response
type UpdateFlashcardResponse = FlashcardDTO;
```

**Error Responses:**
- 404 Not Found: Flashcard doesn't exist
- 400 Bad Request: Invalid request body
- 409 Conflict: Updated values create duplicate
- 422 Unprocessable Entity: Validation error

**Użycie w komponencie:**
```typescript
const updateFlashcard = async (id: number, data: FlashcardFormData) => {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data as FlashcardUpdateCommand),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const updatedFlashcard: FlashcardDTO = await response.json();
  return updatedFlashcard;
};
```

### 7.4. Usuwanie fiszki (DELETE /api/flashcards/{id})

**Request:**
```typescript
DELETE /api/flashcards/123
```

**Response 204 No Content:**
```typescript
// Brak body
```

**Error Responses:**
- 404 Not Found: Flashcard doesn't exist
- 401 Unauthorized: Brak autoryzacji

**Użycie w komponencie:**
```typescript
const deleteFlashcard = async (id: number) => {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  // 204 No Content - brak response body
};
```

## 8. Interakcje użytkownika

### 8.1. Przeglądanie fiszek

**Scenariusz:** Użytkownik wchodzi na `/flashcards`

**Flow:**
1. Strona Astro renderuje się na serwerze z danymi SSR (pierwsza strona fiszek)
2. React hydratuje komponent FlashcardsView z initial data
3. Użytkownik widzi grid fiszek (FlashcardGrid)
4. Każda karta domyślnie pokazuje front

**Interakcje:**
- **Kliknięcie na kartę** → flip animation, pokazuje back fiszki
- **Ponowne kliknięcie** → flip z powrotem na front
- **Keyboard (Enter/Space)** → flip karty
- **Tab navigation** → przechodzenie między kartami

### 8.2. Filtrowanie według źródła

**Scenariusz:** Użytkownik chce zobaczyć tylko fiszki ręczne

**Flow:**
1. Użytkownik klika Select w FlashcardToolbar
2. Wybiera "Ręczne" z listy
3. `onSourceFilterChange('manual')` jest wywoływane
4. URL update: `/flashcards?source=manual&page=1`
5. Fetch nowych danych z API
6. Loading skeleton wyświetlany podczas fetch
7. Grid aktualizuje się z przefiltrowanymi fiszkami

**Edge cases:**
- Filtr "Wszystkie" usuwa parametr `source` z URL
- Zmiana filtra resetuje stronę do 1
- Persist filtra w URL pozwala na bookmark

### 8.3. Paginacja

**Scenariusz:** Użytkownik ma 150 fiszek (3 strony po 50)

**Flow:**
1. Użytkownik klika "Następna" lub numer strony "2"
2. URL update: `/flashcards?page=2`
3. Scroll do góry strony (smooth scroll)
4. Fetch nowych danych z API
5. Grid aktualizuje się z fiszkami ze strony 2

**Edge cases:**
- Previous disabled na stronie 1
- Next disabled na ostatniej stronie
- Bezpośrednie kliknięcie na numer strony

### 8.4. Dodawanie nowej fiszki

**Scenariusz:** Użytkownik chce dodać fiszkę ręcznie

**Flow:**
1. Użytkownik klika "Dodaj fiszkę" w toolbar
2. FlashcardDialog otwiera się w trybie `create`
3. Focus automatycznie na polu "Przód fiszki"
4. Użytkownik wpisuje treść (liczniki znaków na żywo)
5. Walidacja live podczas pisania (max length)
6. Kliknięcie "Zapisz" → POST /api/flashcards
7. Loading state ("Zapisywanie...")
8. Success → Dialog zamyka się, toast "Fiszka została dodana"
9. Lista odświeża się (fetch updated data)

**Edge cases:**
- Submit disabled gdy formularz invalid
- ESC zamyka dialog (z potwierdzeniem jeśli są zmiany?)
- Error 409 Conflict → wyświetlenie komunikatu "Taka fiszka już istnieje"

### 8.5. Edycja fiszki

**Scenariusz:** Użytkownik chce poprawić błąd w fiszce

**Flow:**
1. Użytkownik najeżdża na kartę fiszki
2. Overlay z akcjami pojawia się
3. Kliknięcie ikony ołówka (Edit)
4. FlashcardDialog otwiera się w trybie `edit` z wypełnionymi polami
5. Użytkownik edytuje treść
6. Kliknięcie "Zapisz" → PUT /api/flashcards/{id}
7. Loading state ("Zapisywanie...")
8. Success → Dialog zamyka się, toast "Fiszka została zaktualizowana"
9. Karta w gridzie aktualizuje się (lokalny update)
10. Jeśli source był "ai-full", zmienia się na "ai-edited" (badge update)

**Edge cases:**
- Edycja bez zmian → dozwolone, ale zbędne
- Error 409 Conflict → komunikat duplikatu
- Jeśli backend zmieni source, lokalny stan musi się zaktualizować

### 8.6. Usuwanie fiszki

**Scenariusz:** Użytkownik chce usunąć niepotrzebną fiszkę

**Flow:**
1. Użytkownik najeżdża na kartę fiszki
2. Overlay z akcjami pojawia się
3. Kliknięcie ikony kosza (Delete)
4. DeleteConfirmDialog otwiera się
5. Wyświetlenie fragmentu fiszki dla kontekstu
6. Użytkownik klika "Usuń"
7. Loading state ("Usuwanie...")
8. DELETE /api/flashcards/{id}
9. Success → Dialog zamyka się, toast "Fiszka została usunięta"
10. Karta znika z gridu (animacja fade-out?)
11. Pagination count zmniejsza się

**Edge cases:**
- Kliknięcie "Anuluj" → zamknięcie dialogu bez akcji
- Jeśli to ostatnia fiszka na stronie → redirect do strony poprzedniej
- Error 404 (fiszka już usunięta) → komunikat błędu

### 8.7. Empty state

**Scenariusz:** Nowy użytkownik bez fiszek

**Flow:**
1. Użytkownik wchodzi na `/flashcards`
2. API zwraca pustą listę
3. EmptyState wyświetla się z ilustracją
4. Użytkownik klika "Dodaj fiszkę" → otwiera dialog create
5. LUB klika "Generuj z AI" → redirect do `/generate`

## 9. Warunki i walidacja

### 9.1. Warunki API zweryfikowane na poziomie UI

**FlashcardForm - pole `front`:**

| Warunek | Weryfikacja UI | Komunikat | Moment |
|---------|---------------|-----------|---------|
| Wymagane | `required` w schema | "Przód fiszki jest wymagany" | Submit |
| Min 1 znak po trim | `.trim().min(1)` | "Przód fiszki jest wymagany" | Submit |
| Max 200 znaków | `.max(200)` + `maxLength` na Input | "Przód fiszki może mieć maksymalnie 200 znaków" | Live + Submit |

**FlashcardForm - pole `back`:**

| Warunek | Weryfikacja UI | Komunikat | Moment |
|---------|---------------|-----------|---------|
| Wymagane | `required` w schema | "Tył fiszki jest wymagany" | Submit |
| Min 1 znak po trim | `.trim().min(1)` | "Tył fiszki jest wymagany" | Submit |
| Max 500 znaków | `.max(500)` + `maxLength` na Textarea | "Tył fiszki może mieć maksymalnie 500 znaków" | Live + Submit |

**Uniqueness (duplicates):**

| Warunek | Weryfikacja UI | Komunikat | Moment |
|---------|---------------|-----------|---------|
| Kombinacja front+back unique | Obsługa 409 z API | "Taka fiszka już istnieje (ID: {id})" | Submit response |

### 9.2. Walidacja po stronie komponentów

**FlashcardCard:**
- Brak walidacji
- Tylko display logic

**FlashcardToolbar:**
- Select value musi być jednym z: 'all' | FlashcardSource
- TypeScript type checking zapewnia poprawność

**Pagination:**
- `currentPage` musi być >= 1 i <= `totalPages`
- Buttons Previous/Next disabled odpowiednio
- Kliknięcie na numer strony poza zakresem jest niemożliwe (buttons generowane z range)

**DeleteConfirmDialog:**
- Brak walidacji
- Potwierdzenie operacji

### 9.3. Wpływ walidacji na stan UI

**Submit button disabled gdy:**
```typescript
disabled={isSaving || !isValid}
// isValid = form.formState.isValid z React Hook Form
```

**Wyświetlanie błędów:**
```typescript
{errors.front && (
  <p className="text-sm text-destructive">{errors.front.message}</p>
)}
```

**Liczniki znaków:**
```typescript
<p className={cn(
  "text-xs text-right",
  watchFront.length > 200 ? "text-destructive" : "text-gray-500"
)}>
  {watchFront.length}/200
</p>
```

## 10. Obsługa błędów

### 10.1. Błędy API

**Typy błędów:**

| Status | Scenariusz | Obsługa UI |
|--------|------------|------------|
| 400 Bad Request | Invalid query params | Alert z komunikatem błędu |
| 404 Not Found | Fiszka nie istnieje (edit/delete) | Toast error "Fiszka nie została znaleziona" |
| 409 Conflict | Duplikat (same front+back) | Form error: "Taka fiszka już istnieje (ID: {id})" |
| 422 Unprocessable Entity | Validation error (max length) | Form errors dla specific fields |
| 500 Internal Server Error | Błąd serwera | Toast error "Wystąpił błąd serwera. Spróbuj ponownie." |

**Implementacja obsługi:**

```typescript
async function handleApiError(response: Response): Promise<never> {
  let errorMessage = 'Wystąpił nieznany błąd';
  
  try {
    const errorData: ApiError = await response.json();
    errorMessage = errorData.error.message;
    
    // Specjalne obsługa dla 409 Conflict (duplicate)
    if (response.status === 409 && errorData.error.details) {
      const id = errorData.error.details.id;
      errorMessage = `Taka fiszka już istnieje${id ? ` (ID: ${id})` : ''}`;
    }
  } catch {
    // Fallback jeśli response nie ma JSON body
    errorMessage = `Błąd ${response.status}: ${response.statusText}`;
  }
  
  throw new Error(errorMessage);
}
```

### 10.2. Błędy sieciowe

**Scenariusz:** Brak połączenia z internetem

**Obsługa:**
```typescript
try {
  const response = await fetch('/api/flashcards');
  // ...
} catch (error) {
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    toast({
      title: 'Błąd połączenia',
      description: 'Sprawdź połączenie z internetem i spróbuj ponownie.',
      variant: 'destructive',
    });
  } else {
    toast({
      title: 'Błąd',
      description: error instanceof Error ? error.message : 'Wystąpił nieznany błąd',
      variant: 'destructive',
    });
  }
}
```

### 10.3. Błędy walidacji

**Client-side validation (Zod):**
- Błędy wyświetlane inline pod polami formularza
- Submit disabled gdy formularz invalid
- Live feedback dla liczników znaków

**Server-side validation (422):**
- Wyświetlenie błędów z API w odpowiednich polach formularza
- Mapowanie błędów API na pola formularza (jeśli backend zwraca field-specific errors)

### 10.4. Empty states

**Brak fiszek:**
- EmptyState component z ilustracją i CTA

**Brak fiszek po filtrze:**
```tsx
{flashcards.length === 0 && sourceFilter !== 'all' && (
  <div className="text-center py-16">
    <p className="text-gray-600 dark:text-gray-400 mb-4">
      Nie znaleziono fiszek dla wybranego filtra.
    </p>
    <Button variant="outline" onClick={() => handleSourceFilterChange('all')}>
      Wyczyść filtr
    </Button>
  </div>
)}
```

### 10.5. Loading states

**Loading skeletons:**
- `FlashcardGridSkeleton` podczas fetch
- Animacja `animate-pulse` na skeleton cards

**Saving/Deleting states:**
- Button disabled z spinner: `<LoaderIcon className="animate-spin" />`
- Dialog close disabled podczas operacji

### 10.6. Timeout handling

**Long requests:**
```typescript
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timeout - operacja trwała zbyt długo');
    }
    throw error;
  }
};
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1.1. Utworzyć plik strony Astro:
   - `src/pages/flashcards.astro`

1.2. Utworzyć folder komponentów widoku:
   - `src/components/flashcards/` (directory)

1.3. Utworzyć pliki komponentów React:
   - `src/components/flashcards/FlashcardsView.tsx`
   - `src/components/flashcards/FlashcardToolbar.tsx`
   - `src/components/flashcards/FlashcardGrid.tsx`
   - `src/components/flashcards/FlashcardCard.tsx`
   - `src/components/flashcards/FlashcardCardSkeleton.tsx`
   - `src/components/flashcards/FlashcardGridSkeleton.tsx`
   - `src/components/flashcards/EmptyState.tsx`
   - `src/components/flashcards/Pagination.tsx`
   - `src/components/flashcards/FlashcardDialog.tsx`
   - `src/components/flashcards/FlashcardForm.tsx`
   - `src/components/flashcards/DeleteConfirmDialog.tsx`

1.4. Utworzyć pliki pomocnicze:
   - `src/lib/hooks/useFlashcardList.ts` (custom hook)
   - `src/lib/hooks/useFlashcardQueryParams.ts` (query params management)
   - `src/lib/validation/flashcard.schemas.ts` (już istnieje - sprawdzić czy zawiera potrzebne schematy)

### Krok 2: Instalacja brakujących zależności

2.1. Zainstalować komponenty shadcn/ui:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add alert-dialog
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add badge
npx shadcn@latest add alert
npx shadcn@latest add toast
```

2.2. Zainstalować dodatkowe biblioteki (jeśli nie ma):
```bash
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react # ikony
```

### Krok 3: Dodanie typów do `src/types.ts`

3.1. Dodać nowe typy ViewModels:
   - `DialogState`
   - `FlashcardFormData`
   - `SourceFilterValue`
   - `ToastMessage`
   - `LoadingState`
   - `ErrorState`

3.2. Sprawdzić czy `flashcard.schemas.ts` zawiera `flashcardFormSchema`
   - Jeśli nie, dodać schema walidacji Zod

### Krok 4: Dodanie stylów CSS dla flip effect

4.1. Otworzyć `src/styles/global.css`

4.2. Dodać klasy pomocnicze:
```css
@layer utilities {
  .perspective-1000 {
    perspective: 1000px;
  }
  
  .transform-style-3d {
    transform-style: preserve-3d;
  }
  
  .backface-hidden {
    backface-visibility: hidden;
  }
  
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
}
```

### Krok 5: Implementacja custom hooków

5.1. Implementować `useFlashcardQueryParams`:
   - Odczyt query params z URL
   - Update URL przy zmianie filtrów/strony
   - Return { page, source, updateQueryParams }

5.2. Implementować `useFlashcardList`:
   - Stan listy fiszek, pagination, loading, error
   - Funkcje CRUD: fetchFlashcards, createFlashcard, updateFlashcard, deleteFlashcard
   - Obsługa błędów API

### Krok 6: Implementacja komponentów leaf (od dołu hierarchii)

6.1. **FlashcardCardSkeleton** (najprostszy):
   - Skeleton card z `animate-pulse`
   - Testować wizualnie

6.2. **FlashcardGridSkeleton**:
   - Grid z 9 skeleton cards
   - Testować wizualnie

6.3. **FlashcardCard**:
   - State `isFlipped`
   - Flip effect onClick
   - Hover overlay z akcjami Edit/Delete
   - Badge źródła z odpowiednimi kolorami
   - Keyboard accessibility (Enter/Space)
   - Testować flip animation, hover, keyboard

6.4. **EmptyState**:
   - Ilustracja SVG
   - Tekst i przyciski CTA
   - Testować wizualnie

6.5. **Pagination**:
   - Logika `getPageNumbers()`
   - Buttons Previous/Next/Numbers
   - Info text
   - Testować z różnymi wartościami (1 strona, 3 strony, 20 stron)

### Krok 7: Implementacja formularzy i dialogów

7.1. **FlashcardForm**:
   - React Hook Form + Zod schema
   - Input dla front, Textarea dla back
   - Liczniki znaków (live)
   - Validation errors inline
   - Submit handling
   - Testować walidację: puste pola, max length, submit

7.2. **FlashcardDialog**:
   - Dialog wrapper (shadcn/ui)
   - Mode: create/edit
   - Zawiera FlashcardForm
   - Focus trap
   - Testować open/close, ESC, overlay click

7.3. **DeleteConfirmDialog**:
   - AlertDialog (shadcn/ui)
   - Wyświetlenie fragmentu fiszki
   - Buttons Anuluj/Usuń
   - Loading state
   - Testować open/close, confirm/cancel

### Krok 8: Implementacja komponentów kontenerowych

8.1. **FlashcardGrid**:
   - Grid responsywny (1/2/3 kolumny)
   - Map przez flashcards
   - Render FlashcardCard dla każdej fiszki
   - Testować z różną liczbą fiszek

8.2. **FlashcardToolbar**:
   - Button "Dodaj fiszkę"
   - Select filtr źródła
   - Testować interakcje

### Krok 9: Implementacja głównego komponentu FlashcardsView

9.1. Zaimportować wszystkie komponenty

9.2. Setup state management:
   - useFlashcardQueryParams
   - useFlashcardList
   - useState dla dialogState, loading states

9.3. Implementować handlers:
   - handleOpenCreateDialog
   - handleOpenEditDialog
   - handleOpenDeleteDialog
   - handleCloseDialog
   - handleSaveFlashcard (create/edit)
   - handleConfirmDelete
   - handleSourceFilterChange
   - handlePageChange

9.4. Render logic:
   - Loading → FlashcardGridSkeleton
   - Empty → EmptyState
   - Data → FlashcardGrid + Pagination
   - Dialogi conditional render

9.5. Integracja toast notifications:
   - Success/error toasts po operacjach CRUD

9.6. Testować wszystkie flow:
   - Lista fiszek
   - Filtrowanie
   - Paginacja
   - Create
   - Edit
   - Delete
   - Błędy API

### Krok 10: Implementacja strony Astro

10.1. Otworzyć `src/pages/flashcards.astro`

10.2. Server-side logic:
```astro
---
import Layout from '../layouts/Layout.astro';
import FlashcardsView from '../components/flashcards/FlashcardsView';
import { getSupabaseClient } from '../db/supabase.client';
import { listFlashcards } from '../lib/services/flashcardService';

// TODO: Po wdrożeniu auth, pobierać userId z sesji
const userId = 'test-user-id'; // placeholder

const supabase = getSupabaseClient();

// Parse query params
const url = new URL(Astro.request.url);
const page = Number(url.searchParams.get('page')) || 1;
const source = url.searchParams.get('source') as FlashcardSource | undefined;

// Fetch initial data (SSR)
const initialData = await listFlashcards(supabase, userId, {
  page,
  limit: 50,
  source,
});
---

<Layout title="Moje fiszki - 10x Cards">
  <FlashcardsView
    client:load
    initialData={initialData}
    initialPage={page}
    initialSource={source}
  />
</Layout>
```

10.3. Testować SSR:
   - Dane renderują się na serwerze
   - Hydration działa poprawnie

### Krok 11: Testowanie integracyjne

11.1. Testować cały flow użytkownika:
   - Wejście na `/flashcards`
   - Przeglądanie fiszek
   - Flip cards
   - Filtrowanie
   - Paginacja
   - Create nowej fiszki
   - Edit istniejącej fiszki
   - Delete fiszki

11.2. Testować edge cases:
   - Brak fiszek (empty state)
   - 1 fiszka
   - 50 fiszek (1 strona bez paginacji)
   - 51 fiszek (2 strony)
   - Błędy API (symulować 409, 500)
   - Duplikat przy create
   - Brak połączenia sieciowego

11.3. Testować accessibility:
   - Keyboard navigation (Tab, Enter, Space, ESC)
   - Screen reader (ARIA labels)
   - Focus management w dialogach

11.4. Testować responsywność:
   - Mobile (1 kolumna)
   - Tablet (2 kolumny)
   - Desktop (3 kolumny)

### Krok 12: Optymalizacja i polish

12.1. Dodać transitions:
   - Page transitions (Astro View Transitions)
   - Card flip smooth animation
   - Fade-out przy delete

12.2. Dodać optimistic updates:
   - Update lokalny przed API response (edit)
   - Remove lokalny przed API response (delete)

12.3. Dodać debounce dla search (jeśli implementowane):
   - Delay 300ms przed fetch

12.4. Performance optimization:
   - React.memo dla FlashcardCard (jeśli potrzebne)
   - useCallback dla handlers
   - Lazy load dialogów (React.lazy + Suspense)

### Krok 13: Dokumentacja i code review

13.1. Dodać JSDoc comments do wszystkich komponentów

13.2. Dodać README dla folder `src/components/flashcards/`

13.3. Code review checklist:
   - Wszystkie typy TypeScript poprawne
   - Brak any types
   - Wszystkie errors handled
   - Accessibility requirements spełnione
   - Responsywność działa
   - Loading states wszędzie
   - Validation działa
   - API integration działa

### Krok 14: Deployment readiness

14.1. Testować build production:
```bash
npm run build
```

14.2. Sprawdzić bundle size:
   - Czy nie ma niepotrzebnych dependencies
   - Czy lazy loading działa

14.3. Testować SSR na production build:
```bash
npm run preview
```

14.4. Sprawdzić env variables (gdy auth będzie wdrożony)

---

## Podsumowanie

Ten plan implementacji obejmuje kompletny widok Listy Fiszek zgodny z PRD, wymaganiami API oraz zasadami dostępności i UX. Implementacja powinna zająć około 2-3 dni pracy dla doświadczonego frontend developera.

**Kluczowe punkty:**
- ✅ Responsywny grid z efektem flip 3D
- ✅ CRUD operations z walidacją i error handling
- ✅ Filtrowanie i paginacja z URL persistence
- ✅ Loading states i skeleton screens
- ✅ Empty states z CTA
- ✅ Toast notifications dla feedback
- ✅ Accessibility (keyboard, ARIA, focus management)
- ✅ Type safety (TypeScript + Zod)
- ✅ SSR dla SEO i performance
- ✅ Integracja z istniejącym API i serwisami

Powodzenia w implementacji! 🚀

