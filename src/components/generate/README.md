# Komponenty widoku Generowania Fiszek

Ten folder zawiera wszystkie komponenty React dla widoku `/generate` - funkcjonalności generowania fiszek przy pomocy AI.

## 📁 Struktura komponentów

```
generate/
├── GenerateView.tsx         - Główny kontener zarządzający całym widokiem
├── GenerateForm.tsx         - Formularz wprowadzania tekstu źródłowego
├── CharacterCounter.tsx     - Licznik znaków z walidacją
├── LoadingIndicator.tsx     - Wskaźnik ładowania podczas generowania
├── ProposalSection.tsx      - Sekcja z propozycjami fiszek
├── ProposalList.tsx         - Lista propozycji z kontrolkami
├── ProposalCard.tsx         - Pojedyncza karta propozycji
└── index.ts                 - Eksporty wszystkich komponentów
```

## 🔄 Przepływ danych

```
1. Użytkownik wprowadza tekst (1000-10000 znaków)
   ↓
2. GenerateForm waliduje i wywołuje onGenerate()
   ↓
3. GenerateView wywołuje API POST /api/generations
   ↓
4. LoadingIndicator wyświetlany podczas generowania
   ↓
5. Po sukcesie: ProposalSection z listą propozycji
   ↓
6. Użytkownik przegląda, edytuje, zaznacza propozycje
   ↓
7. ProposalList przygotowuje dane (ai-full vs ai-edited)
   ↓
8. GenerateView wywołuje API POST /api/flashcards
   ↓
9. Toast notification + reset widoku
```

## 🎯 Główne funkcjonalności

### GenerateView

- Zarządzanie stanem widoku (phase: input/loading/reviewing/saving)
- Orkiestracja wywołań API
- Obsługa błędów z toast notifications
- Reset widoku po zapisaniu

### GenerateForm

- Real-time walidacja długości tekstu
- Licznik znaków z wizualnym feedback
- Obsługa Ctrl+Enter dla szybkiego submitu
- Disable podczas ładowania

### ProposalList

- Domyślnie wszystkie propozycje zaznaczone
- Kontrolki "Zaznacz wszystkie" / "Odznacz wszystkie"
- Śledzenie edycji każdej propozycji
- Automatyczne określanie źródła (ai-full/ai-edited)

### ProposalCard

- Inline edycja front (max 200 znaków) i back (max 500 znaków)
- Liczniki znaków dla każdego pola
- Disable pól gdy propozycja niezaznaczona
- Badge "AI" dla źródła

## 📡 Integracja z API

### Wykorzystywane endpointy:

1. **POST /api/generations**
   - Generowanie fiszek z tekstu
   - Request: `{ source_text: string }`
   - Response: `{ generation: GenerationDTO, proposed_flashcards: ProposedFlashcard[] }`

2. **POST /api/flashcards**
   - Zapis zaakceptowanych fiszek (batch)
   - Request: `{ flashcards: FlashcardCreateCommand[] }`
   - Response: `{ data: FlashcardDTO[] }`

## 🎨 Komponenty UI (shadcn/ui)

Wykorzystywane komponenty:

- Button
- Textarea
- Input
- Label
- Card
- Checkbox
- Badge

## 🔧 Typy

Wszystkie typy zdefiniowane w:

- `src/lib/viewModels/generateView.types.ts` - typy ViewModel
- `src/types.ts` - typy API/DTO

## ⚠️ Obsługa błędów

Wykorzystuje centralne funkcje z `src/lib/utils/errorHandlers.ts`:

- `handleGenerateError()` - błędy generowania (409 Conflict, 422 Validation, 500 Server, 503 Unavailable)
- `handleSaveError()` - błędy zapisywania (409 Conflict, 422 Validation)

## 🚀 Użycie

```tsx
import { GenerateView } from "@/components/generate";

// W pliku Astro
<GenerateView client:load initialText={initialText} />;
```

## 📝 TODO (przyszłe ulepszenia)

- [ ] Obsługa wersji roboczych (draft saves)
- [ ] Historia wygenerowanych tekstów (localStorage)
- [ ] Retry mechanism z exponential backoff
- [ ] WebSocket dla real-time progress updates
- [ ] Więcej opcji modeli AI (obecnie hardcoded Claude)
