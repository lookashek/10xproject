# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

### 1.1. Główna koncepcja

Aplikacja 10x-cards w wersji MVP opiera się na desktop-first approach z dashboard'em jako centralnym hubem nawigacyjnym. Interfejs składa się z 7 głównych widoków, które obsługują pełny cykl życia fiszki: od generowania przez AI, przez ręczne tworzenie i zarządzanie, po naukę z wykorzystaniem algorytmu spaced repetition (SM-2).

### 1.2. Kluczowe założenia architektoniczne

- **Desktop-first**: Optimalizacja dla rozdzielczości desktop, responsywność jako przyszłe rozszerzenie
- **Dashboard-centric navigation**: Główne menu w formie dużych kafelków 2×2 zamiast tradycyjnego navbar
- **Single-page flows**: Każda funkcjonalność na dedykowanej stronie bez zaawansowanego routingu zagnieżdżonego
- **Mock authentication**: Uproszczony flow logowania z JWT w localStorage (pełna integracja z Supabase Auth w późniejszej fazie)
- **Protected routes**: Wszystkie widoki poza /login i /register wymagają autentykacji
- **Dark mode support**: Toggle w headerze z localStorage persistence
- **Klasyczna paginacja**: 50 elementów na stronę dla fiszek, 20 dla generacji

### 1.3. Tech stack UI

- **Framework**: Astro 5 (SSR) + React 19 (hydratacja komponentów interaktywnych)
- **Styling**: Tailwind 4 z dark mode support
- **Components**: Shadcn/ui (Button, Card, Dialog, Form, Input, Textarea, Badge, Toast, Skeleton)
- **Icons**: Lucide React
- **Form handling**: React Hook Form + Zod validation
- **State management**: React hooks (useState, useEffect) + localStorage dla persystencji
- **API layer**: Fetch wrapper w `src/lib/api/client.ts`

## 2. Lista widoków

### 2.1. Widok Logowania

- **Ścieżka**: `/login`
- **Typ**: Publiczny widok (Astro page)
- **Główny cel**: Umożliwienie zalogowania się użytkownikowi do aplikacji

#### Kluczowe informacje do wyświetlenia:

- Formularz logowania (email, hasło)
- Logo aplikacji "10x cards"
- Link do widoku rejestracji
- Komunikaty błędów (nieprawidłowe dane, problemy z siecią)

#### Kluczowe komponenty widoku:

- **LoginForm** (React):
  - Input (email) z walidacją email
  - Input (password) z type="password"
  - Button "Zaloguj się" z loading state
  - Link "Nie masz konta? Zarejestruj się"
- **Toast** dla komunikatów błędów

#### Integracja z API:

- `POST /api/auth/login` (mock w MVP, endpoint nie zaimplementowany w API plan)
- Zwraca JWT token zapisywany w localStorage jako `auth_token`
- Po sukcesie redirect do `/dashboard`

#### UX, dostępność i względy bezpieczeństwa:

- **UX**:
  - Auto-focus na polu email
  - Enter submit form
  - Disable przycisku podczas ładowania z loading spinner
  - Jasny komunikat błędu przy niepowodzeniu
- **Dostępność**:
  - Labels dla inputów
  - ARIA labels dla screen readers
  - Focus visible styles
  - Keyboard navigation
- **Bezpieczeństwo**:
  - Password input type
  - XSS prevention przez React auto-escaping
  - JWT w localStorage (HttpOnly cookies w produkcji)
  - Rate limiting na poziomie API

### 2.2. Widok Rejestracji

- **Ścieżka**: `/register`
- **Typ**: Publiczny widok (Astro page)
- **Główny cel**: Umożliwienie utworzenia nowego konta użytkownika

#### Kluczowe informacje do wyświetlenia:

- Formularz rejestracji (email, hasło, powtórz hasło)
- Logo aplikacji
- Link do widoku logowania
- Komunikaty walidacji i błędów

#### Kluczowe komponenty widoku:

- **RegisterForm** (React):
  - Input (email) z walidacją email
  - Input (password) z walidacją siły hasła
  - Input (confirm password) z walidacją zgodności
  - Checkbox akceptacji regulaminu (opcjonalny w MVP)
  - Button "Zarejestruj się" z loading state
  - Link "Masz już konto? Zaloguj się"
- **Toast** dla komunikatów

#### Integracja z API:

- `POST /api/auth/register` (mock w MVP)
- Po sukcesie automatyczne zalogowanie i redirect do `/dashboard`

#### UX, dostępność i względy bezpieczeństwa:

- **UX**:
  - Real-time walidacja siły hasła (wskaźnik siły)
  - Inline walidacja zgodności haseł
  - Komunikat potwierdzenia rejestracji
- **Dostępność**:
  - Semantic HTML (form, fieldset)
  - Clear error messages
  - Keyboard accessible
- **Bezpieczeństwo**:
  - Min 8 znaków hasła
  - Hash hasła po stronie backend (bcrypt)
  - Email uniqueness validation

### 2.3. Dashboard (Hub Główny)

- **Ścieżka**: `/dashboard`
- **Typ**: Chroniony widok (Astro page + React components)
- **Główny cel**: Centrum nawigacyjne i przegląd statystyk użytkownika

#### Kluczowe informacje do wyświetlenia:

- Powitanie użytkownika ("Witaj, {username}!")
- 4 karty ze statystykami:
  1. Całkowita liczba fiszek
  2. Liczba wykonanych generacji AI
  3. Wskaźnik akceptacji fiszek AI (%)
  4. Fiszek oczekujących na naukę
- Menu główne (4 duże kafelki nawigacyjne w grid 2×2):
  1. "Generuj fiszki" → `/generate`
  2. "Moje fiszki" → `/flashcards`
  3. "Sesja nauki" → `/study`
  4. "Historia generacji" → `/generations`

#### Kluczowe komponenty widoku:

- **DashboardHeader** (React):
  - Logo "10x cards" (link do dashboard)
  - Dark mode toggle
  - User dropdown menu (avatar, "Wyloguj się")
- **StatsGrid** (React):
  - 4× StatsCard z ikoną, wartością i opisem
  - Skeleton loading state
- **MenuGrid** (React):
  - 4× MenuTile (duży kafelek z ikoną, tytułem, opisem)
  - Hover effects

#### Integracja z API:

- `GET /api/stats` (dedykowany endpoint do zaimplementowania lub agregacja z:)
  - `GET /api/flashcards?limit=1` dla total count
  - `GET /api/generations?limit=1` dla generation stats
- Opcjonalnie fetch danych ze wszystkich endpointów i obliczenia po stronie frontendu

#### UX, dostępność i względy bezpieczeństwa:

- **UX**:
  - Dashboard jako landing page po zalogowaniu
  - Loading skeletons podczas ładowania statystyk
  - Jasne Call-to-Action dla głównych funkcji
  - Duże, clickable kafelki z hover states
- **Dostępność**:
  - ARIA labels dla statystyk
  - Semantic navigation
  - Keyboard accessible menu tiles
- **Bezpieczeństwo**:
  - Chroniony przez middleware (check JWT token)
  - Redirect do `/login` gdy brak tokenu
  - User-specific data only

### 2.4. Widok Generowania Fiszek

- **Ścieżka**: `/generate`
- **Typ**: Chroniony widok (Astro page + React components)
- **Główny cel**: Wklejenie tekstu źródłowego i wygenerowanie propozycji fiszek przez AI

#### Kluczowe informacje do wyświetlenia:

- Formularz generowania:
  - Textarea dla tekstu źródłowego (1000-10000 znaków)
  - Licznik znaków w czasie rzeczywistym
  - Przycisk "Generuj fiszki"
- Lista wygenerowanych propozycji (po wygenerowaniu):
  - Każda propozycja jako karta z front/back
  - Checkbox do zaznaczenia (domyślnie wszystkie zaznaczone)
  - Możliwość inline edycji (contentEditable lub input)
  - Przycisk "Zapisz wybrane fiszki"
- Stan ładowania podczas generowania (loading indicator z komunikatem)

#### Kluczowe komponenty widoku:

- **GenerateForm** (React):
  - Textarea z:
    - Real-time character counter (pokazuje: "1543 / 10000")
    - Walidacja min/max (disable przycisku gdy out of range)
    - Placeholder z przykładowym tekstem
  - Button "Generuj fiszki" (disabled gdy invalid, loading state)
- **ProposalList** (React):
  - Renderowany tylko po otrzymaniu odpowiedzi z API
  - Każda propozycja to **ProposalCard**:
    - Checkbox "Akceptuj"
    - Front (edytowalny input)
    - Back (edytowalny textarea)
    - Badge "AI" (kolor accent)
  - Button "Zapisz wybrane fiszki" (pokazuje liczbę zaznaczonych)
- **LoadingSpinner** podczas generowania
- **Toast** dla komunikatów sukcesu/błędu

#### Integracja z API:

1. **Generowanie**:
   - `POST /api/generations` z body: `{ source_text: string }`
   - Odpowiedź: `{ generation: {...}, proposed_flashcards: [...] }`
   - Error handling dla 409 (duplicate), 422 (validation), 500/503 (LLM error)

2. **Zapisywanie zaakceptowanych**:
   - `POST /api/flashcards` z body batch:
   ```json
   {
     "flashcards": [
       {
         "front": "...",
         "back": "...",
         "source": "ai-full" lub "ai-edited",
         "generation_id": 46
       }
     ]
   }
   ```

   - `source` = "ai-full" gdy nie edytowano, "ai-edited" gdy zmieniono

#### UX, dostępność i względy bezpieczeństwa:

- **UX**:
  - Real-time character counter (czerwony gdy invalid)
  - Disable przycisku gdy poza zakresem 1000-10000
  - Loading indicator z tekstem "Generowanie fiszek..." (może trwać kilka sekund)
  - Wszystkie propozycje domyślnie zaznaczone
  - Inline edycja propozycji bez otwierania modala
  - Po zapisaniu: toast sukcesu, wyczyszczenie formularza, pozostanie na stronie
  - Informacja o liczbie zapisanych fiszek
- **Dostępność**:
  - Label dla textarea
  - ARIA live region dla licznika znaków
  - Keyboard shortcuts: Ctrl+Enter do submit
  - Focus management
- **Bezpieczeństwo**:
  - Text sanitization (strip HTML tags)
  - Rate limiting: 10 generations/hour
  - XSS prevention

### 2.5. Widok Listy Fiszek

- **Ścieżka**: `/flashcards`
- **Typ**: Chroniony widok (Astro page + React components)
- **Główny cel**: Przeglądanie, edycja, usuwanie i ręczne tworzenie fiszek

#### Kluczowe informacje do wyświetlenia:

- Toolbar:
  - Przycisk "Dodaj fiszkę" (otwiera dialog)
  - Filtry:
    - Dropdown filtr źródła (Wszystkie / AI / AI edytowane / Ręczne)
    - Search input (opcjonalny w MVP - zostawić jako TODO)
- Grid fiszek (3 kolumny):
  - Każda fiszka jako karta z flip effect
  - Front widoczny domyślnie
  - Kliknięcie → flip i pokazanie back
  - Badge źródła (ai-full / ai-edited / manual)
  - Akcje: Edit (ikona ołówka), Delete (ikona kosza)
- Paginacja na dole (klasyczna: Previous, 1, 2, 3, Next)
- Empty state gdy brak fiszek

#### Kluczowe komponenty widoku:

- **FlashcardToolbar** (React):
  - Button "Dodaj fiszkę" → otwiera **FlashcardDialog**
  - Select filtr źródła (onChange fetch filtered list)
- **FlashcardGrid** (React):
  - Grid 3-kolumnowy (grid-cols-3)
  - Każda fiszka to **FlashcardCard**:
    - Card z flip effect (CSS transform rotateY)
    - useState dla isFlipped per karta
    - Front/Back content
    - Badge źródła (różne kolory dla ai-full/ai-edited/manual)
    - Hover overlay z akcjami (Edit, Delete)
- **FlashcardDialog** (React):
  - Dialog (shadcn/ui) dla create/edit
  - **FlashcardForm**:
    - Input "Przód fiszki" (max 200 chars)
    - Textarea "Tył fiszki" (max 500 chars)
    - Liczniki znaków
    - Buttons: "Anuluj", "Zapisz"
- **DeleteConfirmDialog** (React):
  - AlertDialog z pytaniem "Czy na pewno chcesz usunąć tę fiszkę?"
  - Buttons: "Anuluj", "Usuń"
- **Pagination** (React):
  - Buttons Previous/Next
  - Page numbers
  - Info: "Strona 1 z 3 (150 fiszek)"
- **Skeleton** loading state
- **EmptyState** gdy brak fiszek

#### Integracja z API:

1. **Lista fiszek**:
   - `GET /api/flashcards?page={page}&limit=50&source={source}`
   - Odpowiedź: `{ data: [...], pagination: {...} }`

2. **Dodanie ręcznej fiszki**:
   - `POST /api/flashcards` z body: `{ front, back, source: "manual" }`

3. **Edycja**:
   - `PUT /api/flashcards/{id}` z body: `{ front, back }`
   - Source automatycznie zmienia się na "ai-edited" jeśli była "ai-full"

4. **Usunięcie**:
   - `DELETE /api/flashcards/{id}`
   - 204 No Content

#### UX, dostępność i względy bezpieczeństwa:

- **UX**:
  - Flip animation na kliknięcie karty (smooth transition)
  - Hover overlay z akcjami (edit/delete) tylko na hover
  - Potwierdzenie usunięcia (AlertDialog)
  - Toast po zapisaniu/usunięciu
  - Loading skeletons podczas fetch
  - Empty state z CTA "Dodaj pierwszą fiszkę" gdy lista pusta
  - Paginacja tylko gdy więcej niż 50 fiszek
  - Filtr źródła persist w URL query params
- **Dostępność**:
  - Keyboard navigation: Tab między kartami, Enter do flip
  - ARIA labels dla akcji
  - Focus trap w dialogach
  - Semantic HTML
- **Bezpieczeństwo**:
  - Validation max lengths (200/500)
  - Uniqueness check (409 Conflict handling)
  - User-specific data (RLS w bazie)

### 2.6. Widok Sesji Nauki

- **Ścieżka**: `/study`
- **Typ**: Chroniony widok (Astro page + React component)
- **Główny cel**: Efektywna nauka fiszek z wykorzystaniem algorytmu SM-2 (spaced repetition)

#### Kluczowe informacje do wyświetlenia:

- Pełnoekranowy minimal UI (bez header/sidebar podczas sesji)
- Header sesji:
  - Progress bar (pokazuje: fiszka X z Y)
  - Liczba pozostałych fiszek
  - Przycisk "Zakończ sesję" (powrót do dashboard)
- Karta fiszki (centralna, duża):
  - Przód fiszki (domyślnie widoczny)
  - Przycisk "Pokaż odpowiedź" / Back po kliknięciu
- Przyciski oceny (widoczne po pokazaniu odpowiedzi):
  - "Powtórz" (Again) - nie pamiętam, pokaż znowu
  - "Trudne" (Hard) - pamiętam słabo
  - "Dobre" (Good) - pamiętam
  - "Łatwe" (Easy) - pamiętam dobrze
- Keyboard shortcuts: 1-4 dla przycisków oceny, Spacja dla flip

#### Kluczowe komponenty widoku:

- **StudySession** (React):
  - Pełna logika algorytmu SM-2 (implementacja w komponencie lub hook)
  - Stan:
    - currentCard (aktualna fiszka)
    - isFlipped (czy pokazano back)
    - cardsQueue (kolejka fiszek do nauki)
    - reviewedCount (liczba przejrzanych)
  - **StudyCard** (sub-component):
    - Duża karta z front/back
    - Smooth flip transition
  - **StudyControls** (sub-component):
    - 4 przyciski oceny z ikonami i keyboard hints
    - Disabled gdy nie pokazano back
  - **ProgressBar** na górze

#### Integracja z API:

1. **Pobieranie fiszek do nauki**:
   - `GET /api/flashcards?limit=100` (wszystkie lub filtr ready for review)
   - W MVP: pobierz wszystkie fiszki, algorytm SM-2 działa lokalnie
   - W przyszłości: backend endpoint `/api/study/session` zwracający fiszki due for review

2. **Zapisywanie wyników nauki**:
   - W MVP: localStorage dla trackowania postępu (klucz: `study_progress_{user_id}`)
   - W przyszłości: `POST /api/study/review` z body: `{ flashcard_id, quality: 0-4 }`

#### Algorytm SM-2 (uproszczony w MVP):

- Quality scale: 0 (Again), 1 (Hard), 2 (Good), 3 (Easy)
- Tracking w localStorage:
  - `{ flashcard_id: { easiness: 2.5, interval: 1, nextReview: Date } }`
- Intervals: Again=1min, Hard=10min, Good=1day, Easy=4days (dla pierwszego review)

#### UX, dostępność i względy bezpieczeństwa:

- **UX**:
  - Full-screen distraction-free mode
  - Duża, czytelna czcionka dla contentu fiszki
  - Smooth animations
  - Keyboard shortcuts (1-4, Spacja)
  - Progress tracking
  - Komunikat końca sesji: "Świetna robota! Przejrzałeś {count} fiszek"
  - Możliwość przerwania sesji w każdej chwili
- **Dostępność**:
  - Keyboard-only navigation
  - ARIA live regions dla screen readers
  - High contrast mode support
  - Focus visible
- **Bezpieczeństwo**:
  - localStorage sanitization
  - Client-side algorithm (no sensitive data)

### 2.7. Widok Historii Generacji

- **Ścieżka**: `/generations`
- **Typ**: Chroniony widok (Astro page + React components)
- **Główny cel**: Przegląd historii wszystkich generacji AI z statystykami akceptacji

#### Kluczowe informacje do wyświetlenia:

- Lista generacji (table lub card list):
  - Data utworzenia
  - Długość tekstu źródłowego (liczba znaków)
  - Liczba wygenerowanych fiszek
  - Liczba zaakceptowanych bez edycji
  - Liczba zaakceptowanych z edycją
  - Wskaźnik akceptacji (%)
  - Czas generowania (ms)
  - Akcja: "Zobacz szczegóły" (link do `/generations/{id}`)
- Paginacja (20 generacji na stronę)
- Możliwość kliknięcia wiersza → szczegóły generacji

#### Kluczowe komponenty widoku:

- **GenerationList** (React):
  - Table responsywne (shadcn/ui table)
  - Kolumny:
    - Data
    - Długość tekstu
    - Wygenerowano
    - Zaakceptowano (unedited/edited)
    - Wskaźnik akceptacji (progress bar)
    - Akcje
  - Sortowanie: newest first
  - Hover effect na wierszach
- **Pagination** (reused component)
- **Skeleton** loading state

#### Integracja z API:

1. **Lista generacji**:
   - `GET /api/generations?page={page}&limit=20`
   - Odpowiedź: `{ data: [...], pagination: {...} }`

2. **Szczegóły generacji** (osobna strona `/generations/{id}`):
   - `GET /api/generations/{id}`
   - Odpowiedź zawiera: generation data + associated flashcards
   - Pokazuje:
     - Wszystkie dane generacji
     - Tekst źródłowy (opcjonalnie, może być długi - collapse/expand)
     - Lista powiązanych fiszek z statusem (zaakceptowana/edytowana)

#### UX, dostępność i względy bezpieczeństwa:

- **UX**:
  - Sortowanie domyślnie: newest first
  - Progress bar dla wskaźnika akceptacji (wizualizacja %)
  - Clickable rows → szczegóły
  - Loading state podczas fetch
  - Empty state gdy brak generacji: "Nie masz jeszcze żadnych generacji. Zacznij od wygenerowania fiszek!"
- **Dostępność**:
  - Semantic table with headers
  - ARIA sort attributes
  - Keyboard navigation
- **Bezpieczeństwo**:
  - User-specific data only
  - Rate limiting

## 3. Mapa podróży użytkownika

### 3.1. Główny flow użytkownika (Happy Path)

#### Onboarding i pierwszy kontakt:

```
1. Użytkownik wchodzi na aplikację (/) → redirect do /login (jeśli nie zalogowany)
2. Nowy użytkownik klika "Zarejestruj się" → /register
3. Wypełnia formularz rejestracji (email, hasło) → submit
4. Automatyczne zalogowanie → redirect do /dashboard
5. Dashboard pokazuje powitanie i statystyki (wszystkie na 0 dla nowego użytkownika)
```

#### Pierwszy cykl generowania i nauki:

```
6. Użytkownik klika kafelek "Generuj fiszki" → /generate
7. Wkleja tekst źródłowy (np. fragment podręcznika) → monitoruje licznik znaków
8. Klika "Generuj fiszki" → loading indicator (3-10s)
9. Otrzymuje listę propozycji (domyślnie wszystkie zaznaczone)
10. Przegląda propozycje, opcjonalnie edytuje niektóre
11. Klika "Zapisz wybrane fiszki" → toast sukcesu
12. Wraca do dashboard (przycisk/logo) → statystyki zaktualizowane
13. Klika "Moje fiszki" → /flashcards
14. Przegląda zapisane fiszki (flip na kliknięcie)
15. Opcjonalnie dodaje ręczną fiszkę ("Dodaj fiszkę" → dialog → formularz)
16. Wraca do dashboard → klika "Sesja nauki" → /study
17. Rozpoczyna sesję nauki:
    - Widzi przód fiszki → klika "Pokaż odpowiedź"
    - Ocenia swoją wiedzę (Again/Hard/Good/Easy)
    - Algorytm pokazuje kolejną fiszkę
    - Proces powtarza się dla wszystkich fiszek w sesji
18. Kończy sesję → komunikat sukcesu → powrót do dashboard
19. Klika "Historia generacji" → /generations
20. Przegląda statystyki akceptacji poprzednich generacji
```

### 3.2. Alternatywne ścieżki użytkownika

#### Ścieżka zarządzania fiszkami:

```
Dashboard → Moje fiszki → Lista fiszek
  → Kliknięcie Edit → Dialog edycji → Zapisz → Lista odświeżona
  → Kliknięcie Delete → Confirm dialog → Usuń → Lista odświeżona
  → Filtrowanie po źródle → Lista przefiltrowana
  → Paginacja → Kolejna strona
```

#### Ścieżka error handling:

```
Generate → Wkleja tekst poza zakresem → Przycisk disabled + czerwony counter
Generate → Wkleja duplikat tekstu → 409 Conflict → Toast z linkiem do istniejącej generacji
Generate → LLM API failure → 500/503 → Toast "Spróbuj ponownie" + retry button
Flashcards → Próba dodania duplikatu → 409 Conflict → Toast "Taka fiszka już istnieje"
```

#### Ścieżka powracającego użytkownika:

```
/ → redirect /login (jeśli nie zalogowany) lub /dashboard (jeśli zalogowany)
Login → Submit → Dashboard z aktualnymi statystykami
Dashboard → Sesja nauki → Kontynuacja z miejsca gdzie skończył (localStorage)
```

### 3.3. User journey map (wizualny flow)

```
[START] → / (Landing/Root)
            ↓
    [Nie zalogowany?] → /login ←→ /register
            ↓ [Zalogowany]
        /dashboard (Hub)
            ↓
    ┌───────┼───────┬───────┐
    ↓       ↓       ↓       ↓
/generate /flashcards /study /generations
    ↓       ↓       ↓       ↓
 [List]  [Grid]  [Session] [List]
    ↓       ↓       ↓       ↓
[Proposals] [CRUD] [Algorithm] [Details]
    ↓       ↓       ↓       ↓
 [Save]  [Done]  [Done]  [Done]
    ↓       ↓       ↓       ↓
    └───────┴───────┴───────┘
            ↓
      Powrót do /dashboard
```

### 3.4. Kluczowe punkty decyzyjne użytkownika

1. **Login vs Register**: Nowy użytkownik wybiera rejestrację, powracający logowanie
2. **Którą funkcję wybrać z dashboard**:
   - Nowy użytkownik → "Generuj fiszki" (main feature)
   - Powracający → "Sesja nauki" (kontynuacja nauki) lub "Moje fiszki" (zarządzanie)
3. **Generowanie - edycja propozycji**:
   - Akceptacja wszystkich (szybka ścieżka)
   - Edycja wybranych (quality-focused)
   - Odrzucenie niektórych (selekcja)
4. **Sesja nauki - ocena fiszki**: Again → trudna, Easy → łatwa (wpływ na algorytm)
5. **Lista fiszek - CRUD**:
   - Dodaj nową (ręcznie)
   - Edytuj istniejącą
   - Usuń zbędną

## 4. Układ i struktura nawigacji

### 4.1. Główna struktura nawigacji

#### Poziomy nawigacji:

1. **Top-level navigation** (Header - obecny na wszystkich widokach chronionych):
   - Logo "10x cards" (link do /dashboard)
   - Dark mode toggle (Sun/Moon icon)
   - User dropdown menu:
     - Avatar z inicjałami
     - Dropdown: "Wyloguj się"

2. **Dashboard navigation** (Menu główne - tylko na /dashboard):
   - 4 duże kafelki w grid 2×2:
     - "Generuj fiszki" (ikona Sparkles) → /generate
     - "Moje fiszki" (ikona Library) → /flashcards
     - "Sesja nauki" (ikona GraduationCap) → /study
     - "Historia generacji" (ikona History) → /generations

3. **In-page navigation**:
   - Breadcrumbs: NIE w MVP (za dużo dla prostej struktury)
   - Back buttons: NIE (logo zawsze wraca do dashboard)
   - Pagination: TAK dla /flashcards i /generations

#### Nawigacja mobilna:

- Poza zakresem MVP (desktop-first)
- W przyszłości: hamburger menu, stack kafelki vertically

### 4.2. Protected vs Public Routes

#### Public routes (dostępne bez logowania):

- `/` - Landing page (TBD: public landing lub redirect do /login)
- `/login` - Widok logowania
- `/register` - Widok rejestracji

#### Protected routes (wymagają JWT token):

- `/dashboard` - Hub główny
- `/generate` - Generowanie fiszek
- `/flashcards` - Lista fiszek
- `/study` - Sesja nauki
- `/generations` - Historia generacji
- `/generations/{id}` - Szczegóły generacji

#### Middleware logic:

```typescript
// src/middleware/index.ts
export function onRequest({ request, redirect, locals }) {
  const token = getTokenFromCookie(request); // lub localStorage w client-side
  const url = new URL(request.url);
  const isPublic = ["/login", "/register", "/"].includes(url.pathname);

  if (!token && !isPublic) {
    return redirect("/login");
  }

  if (token && (url.pathname === "/login" || url.pathname === "/register")) {
    return redirect("/dashboard");
  }

  locals.user = token ? verifyToken(token) : null;
}
```

### 4.3. Wzorce nawigacyjne

#### Nawigacja między widokami:

1. **Hub-and-spoke model**: Dashboard jako centralny hub, wszystkie inne widoki jako spokes
2. **No nested routing**: Płaska struktura, każdy widok na tym samym poziomie
3. **Logo jako home**: Kliknięcie logo zawsze wraca do dashboard
4. **No sidebar**: Menu tylko na dashboard (kafelki), nie persistent sidebar

#### Konsystencja nawigacji:

- Header identyczny na wszystkich chronionych widokach
- Logo zawsze w tym samym miejscu (top-left)
- Dark mode toggle zawsze w tym samym miejscu (top-right przed user menu)
- User dropdown zawsze w tym samym miejscu (top-right corner)

### 4.4. URL structure

```
Public:
  /                     - Landing page lub redirect
  /login                - Logowanie
  /register             - Rejestracja

Protected:
  /dashboard            - Hub główny
  /generate             - Generowanie fiszek AI
  /flashcards           - Lista fiszek (z query params ?page=1&source=all)
  /study                - Sesja nauki
  /generations          - Historia generacji (z query params ?page=1)
  /generations/{id}     - Szczegóły generacji
```

#### Query parameters:

- `/flashcards?page=2&limit=50&source=ai-full` - paginacja i filtrowanie
- `/generations?page=1&limit=20` - paginacja

#### No hash routing: Używamy standard path routing (Astro SSR)

### 4.5. Navigation states

#### Active state:

- Brak persistent menu (poza dashboard) → brak active state dla menu items
- Breadcrumbs nie ma w MVP

#### Loading states podczas nawigacji:

- Astro SSR → Full page reload (native browser loading indicator)
- W przyszłości: View Transitions API dla smooth page transitions

## 5. Kluczowe komponenty

### 5.1. Komponenty nawigacyjne

#### DashboardHeader.tsx (React)

- **Cel**: Persistent header na wszystkich chronionych widokach
- **Props**: `user: { id, email, name? }`
- **State**: `isDarkMode` (sync z localStorage)
- **Elementy**:
  - Logo (link do /dashboard)
  - Dark mode toggle (Button z Sun/Moon icon)
  - UserDropdown (avatar, menu)
- **Używany w**: Wszystkie protected pages

#### MenuTile.tsx (React)

- **Cel**: Duży kafelek nawigacyjny na dashboard
- **Props**: `icon, title, description, href`
- **Elementy**:
  - Card z hover effect
  - Ikona (large size, accent color)
  - Tytuł (heading)
  - Opis (muted text)
  - Link (Astro Link component)
- **Używany w**: Dashboard

### 5.2. Komponenty fiszek

#### FlashcardCard.tsx (React)

- **Cel**: Karta fiszki z flip effect
- **Props**: `flashcard: { id, front, back, source }, onEdit?, onDelete?, isInteractive: boolean`
- **State**: `isFlipped: boolean`
- **Elementy**:
  - Card z CSS transform (rotateY)
  - Front side (domyślnie widoczny)
  - Back side (po flip)
  - Badge źródła (różne kolory)
  - Hover overlay z akcjami (Edit, Delete icons)
- **Logika**: Toggle flip na kliknięcie, emit events dla edit/delete
- **Używany w**: /flashcards (grid), /generations/{id} (lista)

#### FlashcardForm.tsx (React)

- **Cel**: Formularz create/edit fiszki
- **Props**: `mode: 'create' | 'edit', flashcard?: { front, back }, onSubmit, onCancel`
- **Validation**: Zod schema (max 200/500 chars)
- **Elementy**:
  - Input "Przód fiszki" z licznikiem
  - Textarea "Tył fiszki" z licznikiem
  - Inline error messages
  - Buttons: Cancel, Save
- **Używany w**: FlashcardDialog (w /flashcards)

#### FlashcardDialog.tsx (React)

- **Cel**: Modal wrapper dla FlashcardForm
- **Props**: `isOpen, onClose, mode, flashcard?`
- **Elementy**:
  - Dialog (shadcn/ui)
  - FlashcardForm
- **Używany w**: /flashcards (toolbar button "Dodaj fiszkę", edit action)

### 5.3. Komponenty generowania

#### GenerateForm.tsx (React)

- **Cel**: Formularz do generowania fiszek AI
- **Props**: `onGenerate: (text: string) => void, isLoading: boolean`
- **State**: `sourceText: string`
- **Validation**: 1000-10000 chars
- **Elementy**:
  - Label + Textarea (duże, multi-line)
  - Real-time character counter:
    - Format: "1543 / 10000"
    - Kolor: red gdy out of range, green gdy valid
  - Button "Generuj fiszki" (disabled gdy invalid lub isLoading)
  - Loading spinner w przycisku gdy isLoading
- **Używany w**: /generate

#### ProposalList.tsx (React)

- **Cel**: Lista propozycji fiszek z checkboxami i edycją
- **Props**: `proposals: { front, back }[], generationId: number, onSave`
- **State**: `selectedIds: Set<number>`, `editedProposals: Map<number, { front, back }>`
- **Elementy**:
  - Lista **ProposalCard** (każda z checkbox, front input, back textarea)
  - "Select all" / "Deselect all" buttons
  - Counter: "Zaznaczono X z Y fiszek"
  - Button "Zapisz wybrane fiszki" (disabled gdy none selected)
- **Logika**:
  - Track edits → jeśli edited to source="ai-edited", else "ai-full"
  - Batch save via POST /api/flashcards
- **Używany w**: /generate (po wygenerowaniu)

#### ProposalCard.tsx (React)

- **Cel**: Single proposal card w liście propozycji
- **Props**: `proposal: { front, back }, isSelected, onToggle, onChange`
- **Elementy**:
  - Checkbox
  - Input (front) z max 200 chars
  - Textarea (back) z max 500 chars
  - Badge "AI"
- **Używany w**: ProposalList

### 5.4. Komponenty nauki

#### StudySession.tsx (React)

- **Cel**: Pełna logika sesji nauki z algorytmem SM-2
- **Props**: `flashcards: Flashcard[]`
- **State**:
  - `currentCardIndex: number`
  - `isFlipped: boolean`
  - `cardsQueue: Flashcard[]`
  - `reviewedCount: number`
  - `sessionProgress: Map<flashcard_id, review_data>`
- **Elementy**:
  - StudyHeader (progress bar, count)
  - StudyCard (current flashcard)
  - Button "Pokaż odpowiedź" (gdy !isFlipped)
  - StudyControls (rating buttons gdy isFlipped)
  - SessionComplete (gdy koniec kolejki)
- **Logika**:
  - Algorytm SM-2
  - Keyboard shortcuts (1-4, Space)
  - localStorage persistence
- **Używany w**: /study

#### StudyCard.tsx (React)

- **Cel**: Duża karta do wyświetlenia fiszki w sesji
- **Props**: `front: string, back: string, isFlipped: boolean`
- **Elementy**:
  - Card z flip animation
  - Large text, centered
  - Minimal design
- **Używany w**: StudySession

#### StudyControls.tsx (React)

- **Cel**: Przyciski oceny dla algorytmu
- **Props**: `onRate: (quality: 0-3) => void, disabled: boolean`
- **Elementy**:
  - 4 przyciski:
    - "Powtórz" (Again) - red
    - "Trudne" (Hard) - orange
    - "Dobre" (Good) - green
    - "Łatwe" (Easy) - blue
  - Każdy z keyboard hint (1-4)
  - Icons (różne dla każdego)
- **Używany w**: StudySession

### 5.5. Komponenty statystyk i historii

#### StatsCard.tsx (React)

- **Cel**: Karta statystyki na dashboard
- **Props**: `icon, label, value, description?, trend?`
- **Elementy**:
  - Card (shadcn/ui)
  - Icon (accent color)
  - Value (large number)
  - Label (muted)
  - Optional trend indicator (↑ green, ↓ red)
- **Używany w**: Dashboard (StatsGrid)

#### GenerationList.tsx (React)

- **Cel**: Table lista generacji z statystykami
- **Props**: `generations: Generation[], pagination`
- **Elementy**:
  - Table (shadcn/ui) z kolumnami:
    - Data
    - Długość tekstu
    - Wygenerowano
    - Zaakceptowano
    - Wskaźnik akceptacji (progress bar)
    - Akcje
  - Clickable rows → link do /generations/{id}
  - Pagination controls
- **Używany w**: /generations

### 5.6. Komponenty UI ogólne (reusable)

#### Pagination.tsx (React)

- **Cel**: Kontrolki paginacji
- **Props**: `currentPage, totalPages, onPageChange`
- **Elementy**:
  - Button "Poprzednia"
  - Page numbers (max 5 visible)
  - Button "Następna"
  - Info: "Strona X z Y"
- **Używany w**: /flashcards, /generations

#### LoadingSpinner.tsx (React)

- **Cel**: Indicator ładowania
- **Props**: `size?: 'sm' | 'md' | 'lg', text?: string`
- **Elementy**:
  - Spinner (CSS animation)
  - Optional text below
- **Używany w**: Wszędzie gdzie loading state

#### EmptyState.tsx (React)

- **Cel**: Placeholder gdy brak danych
- **Props**: `icon, title, description, actionLabel?, onAction?`
- **Elementy**:
  - Icon (large, muted)
  - Heading
  - Description
  - Optional CTA button
- **Używany w**: /flashcards (empty), /generations (empty)

#### ErrorBoundary.tsx (React)

- **Cel**: Root-level error boundary
- **State**: `hasError: boolean, error: Error`
- **Elementy**:
  - Error message (user-friendly)
  - Stack trace (dev mode only)
  - Button "Odśwież stronę"
- **Używany w**: Root layout (wrap all pages)

#### Toast.tsx (React)

- **Cel**: Notifications (success, error, info)
- **Props**: via toast() function from sonner or shadcn/ui
- **Konfiguracja**:
  - Position: top-right
  - Duration: 5s
  - Types: success (green), error (red), info (blue)
- **Używany w**: Wszystkie formularze i akcje CRUD

### 5.7. Komponenty formularzy (shadcn/ui based)

Wykorzystujemy komponenty z shadcn/ui:

- **Button** - już istnieje w projekcie
- **Input** - text inputs z walidacją
- **Textarea** - multi-line text z licznikiem znaków
- **Select** - dropdown dla filtrów
- **Checkbox** - zaznaczanie propozycji
- **Dialog** - modals dla create/edit
- **AlertDialog** - potwierdzenia usunięcia
- **Card** - kontenery dla fiszek i statystyk
- **Badge** - źródło fiszki (ai-full/ai-edited/manual)
- **Skeleton** - loading placeholders
- **Progress** - progress bar dla sesji nauki

## 6. Integracja z API

### 6.1. API Client Architecture

#### Struktura klienta API:

```typescript
// src/lib/api/client.ts
export async function apiClient(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.json());
  }

  return response.json();
}
```

#### Modułowe API serwisy:

```typescript
// src/lib/api/flashcards.ts
export const flashcardsApi = {
  list: (params: ListParams) => apiClient("/flashcards", { params }),
  get: (id: number) => apiClient(`/flashcards/${id}`),
  create: (data: CreateFlashcardDto) => apiClient("/flashcards", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: UpdateFlashcardDto) =>
    apiClient(`/flashcards/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiClient(`/flashcards/${id}`, { method: "DELETE" }),
};

// src/lib/api/generations.ts
export const generationsApi = {
  generate: (sourceText: string) =>
    apiClient("/generations", { method: "POST", body: JSON.stringify({ source_text: sourceText }) }),
  list: (params: ListParams) => apiClient("/generations", { params }),
  get: (id: number) => apiClient(`/generations/${id}`),
};

// src/lib/api/auth.ts (mock w MVP)
export const authApi = {
  login: (email: string, password: string) => mockLogin(email, password),
  register: (email: string, password: string) => mockRegister(email, password),
  logout: () => localStorage.removeItem("auth_token"),
};
```

### 6.2. Error Handling Strategy

#### Mapping błędów API na komunikaty użytkownika:

```typescript
// src/lib/utils/errors.ts
export function getErrorMessage(error: ApiError): string {
  switch (error.status) {
    case 400:
      return error.details?.message || "Nieprawidłowe dane formularza";
    case 401:
      return "Sesja wygasła. Zaloguj się ponownie.";
    case 404:
      return "Nie znaleziono zasobu";
    case 409:
      if (error.code === "DUPLICATE_GENERATION") {
        return "Ta treść została już wygenerowana. Zobacz historię generacji.";
      }
      return "Taki rekord już istnieje";
    case 422:
      return error.details?.message || "Dane nie spełniają wymagań";
    case 429:
      return "Przekroczono limit żądań. Spróbuj ponownie później.";
    case 500:
    case 503:
      return "Wystąpił problem z serwerem. Spróbuj ponownie.";
    default:
      return "Wystąpił nieoczekiwany błąd";
  }
}
```

#### Toast notifications dla błędów:

- **400/422**: Inline errors przy polach formularza + optional toast
- **409**: Toast z dedykowanym komunikatem (np. link do istniejącej generacji)
- **500/503**: Toast z przyciskiem "Spróbuj ponownie"
- **401**: Toast + redirect do /login
- **429**: Toast z informacją o rate limiting

### 6.3. Loading States

#### Rodzaje loading states:

1. **Full page loading** (Astro SSR): Native browser loading indicator
2. **Component loading** (React):
   - Skeleton placeholders dla list (FlashcardGrid, GenerationList)
   - Spinner dla długich operacji (generowanie AI)
   - Button loading state (spinner + disabled)
3. **Optimistic updates**: NIE w MVP (wait for API response)

#### Implementacja:

```typescript
// W komponencie:
const [isLoading, setIsLoading] = useState(false);

async function handleSubmit() {
  setIsLoading(true);
  try {
    await apiClient('/flashcards', { method: 'POST', ... });
    toast.success('Fiszka dodana!');
  } catch (error) {
    toast.error(getErrorMessage(error));
  } finally {
    setIsLoading(false);
  }
}
```

### 6.4. Data Fetching Patterns

#### SSR (Astro pages):

```astro
---
// src/pages/flashcards.astro
import { flashcardsApi } from "@/lib/api/flashcards";

const page = Astro.url.searchParams.get("page") || 1;
const { data, pagination } = await flashcardsApi.list({ page });
---

<FlashcardGrid flashcards={data} pagination={pagination} client:load />
```

#### Client-side (React components):

```typescript
// W komponencie React:
useEffect(() => {
  async function fetchData() {
    setIsLoading(true);
    try {
      const data = await flashcardsApi.list({ page: currentPage });
      setFlashcards(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }
  fetchData();
}, [currentPage]);
```

## 7. Zarządzanie stanem

### 7.1. State Management Strategy

#### Brak globalnego state management w MVP:

- **NIE używamy**: Redux, Zustand, MobX
- **Używamy**: React hooks (useState, useEffect, useContext tylko lokalnie)

#### Rodzaje stanu:

1. **Server state**: Dane z API (flashcards, generations)
   - Fetch on demand
   - No caching w MVP
   - Re-fetch po każdej akcji (create, update, delete)

2. **UI state**: Interakcje użytkownika (modals, dropdowns, flip states)
   - Local component state (useState)
   - No persistence (reset on unmount)

3. **Form state**: React Hook Form + Zod
   - Walidacja schema-based
   - Error handling automatyczny

4. **Auth state**: JWT token
   - localStorage key: `auth_token`
   - Check in middleware
   - Access in components via context (optional) lub direct localStorage read

5. **Theme state**: Dark mode preference
   - localStorage key: `theme`
   - Values: 'light' | 'dark' | 'system'
   - Apply via class on <html> tag

6. **Study progress**: Algorytm SM-2 tracking
   - localStorage key: `study_progress_{user_id}`
   - Format: `{ [flashcard_id]: { easiness, interval, nextReview } }`

### 7.2. localStorage Usage

#### Klucze localStorage:

```typescript
// src/lib/utils/storage.ts
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  THEME: "theme",
  STUDY_PROGRESS: (userId: string) => `study_progress_${userId}`,
};

export function getItem<T>(key: string): T | null {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
}

export function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}
```

## 8. Walidacja i błędy

### 8.1. Walidacja po stronie klienta

#### Zod schemas:

```typescript
// src/lib/validation/flashcard.schemas.ts (już istnieje)
import { z } from "zod";

export const flashcardSchema = z.object({
  front: z.string().min(1, "Pole nie może być puste").max(200, "Maksymalnie 200 znaków"),
  back: z.string().min(1, "Pole nie może być puste").max(500, "Maksymalnie 500 znaków"),
  source: z.enum(["ai-full", "ai-edited", "manual"]),
});

export const generateSchema = z.object({
  sourceText: z.string().min(1000, "Minimum 1000 znaków").max(10000, "Maksymalnie 10000 znaków"),
});
```

#### React Hook Form integration:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm({
  resolver: zodResolver(flashcardSchema),
  defaultValues: { front: "", back: "", source: "manual" },
});
```

### 8.2. Komunikaty błędów (PL)

#### Mapowanie komunikatów:

```typescript
// src/lib/utils/messages.ts
export const ERROR_MESSAGES = {
  REQUIRED: "To pole jest wymagane",
  EMAIL_INVALID: "Nieprawidłowy adres email",
  PASSWORD_TOO_SHORT: "Hasło musi mieć minimum 8 znaków",
  PASSWORDS_DONT_MATCH: "Hasła nie są identyczne",
  TEXT_TOO_SHORT: (min: number) => `Tekst musi mieć minimum ${min} znaków`,
  TEXT_TOO_LONG: (max: number) => `Tekst może mieć maksymalnie ${max} znaków`,
  NETWORK_ERROR: "Sprawdź połączenie internetowe i spróbuj ponownie",
  DUPLICATE_FLASHCARD: "Taka fiszka już istnieje w Twojej kolekcji",
  DUPLICATE_GENERATION: "Ta treść została już wygenerowana. Zobacz historię generacji.",
  GENERATION_FAILED: "Nie udało się wygenerować fiszek. Spróbuj ponownie.",
};

export const SUCCESS_MESSAGES = {
  FLASHCARD_CREATED: "Fiszka dodana pomyślnie",
  FLASHCARD_UPDATED: "Fiszka zaktualizowana",
  FLASHCARD_DELETED: "Fiszka usunięta",
  FLASHCARDS_SAVED: (count: number) => `Zapisano ${count} fiszek`,
  SESSION_COMPLETE: (count: number) => `Świetna robota! Przejrzałeś ${count} fiszek`,
};
```

## 9. Dostępność (A11y)

### 9.1. Wymagania WCAG AA

#### Keyboard navigation:

- Tab order logiczny
- Focus visible styles (outline)
- Keyboard shortcuts:
  - Enter: submit form
  - Escape: close dialog
  - Space: flip card w /study
  - 1-4: rate flashcard w /study
  - Ctrl+Enter: submit textarea w /generate

#### Screen readers:

- Semantic HTML (header, nav, main, article, section)
- ARIA labels dla ikon bez tekstu
- ARIA live regions dla:
  - Toast notifications
  - Character counters
  - Loading indicators
- ARIA expanded/collapsed dla dropdowns

#### Visual:

- Contrast ratio min 4.5:1 (WCAG AA)
- Dark mode ma również odpowiedni kontrast
- Focus indicators (outline) na wszystkich interaktywnych elementach
- No color-only information (icons + text dla statusów)

### 9.2. Accessibility checklist per widok

#### Wszystkie widoki:

- [ ] Keyboard navigation działa
- [ ] Focus trap w dialogs
- [ ] ARIA labels obecne
- [ ] Semantic HTML
- [ ] Contrast check passed

#### Formularze:

- [ ] Labels dla wszystkich inputów
- [ ] Error messages dostępne dla screen readers
- [ ] Required fields oznaczone
- [ ] Form validation messages accessible

#### Listy i gridy:

- [ ] Arrow key navigation (opcjonalne w MVP)
- [ ] ARIA roles (list, listitem)
- [ ] Pagination keyboard accessible

## 10. Bezpieczeństwo

### 10.1. Client-side security measures

#### XSS Prevention:

- React auto-escaping (domyślnie)
- Sanitize user input jeśli używamy dangerouslySetInnerHTML (nie używamy w MVP)
- CSP headers (Content Security Policy)

#### Authentication:

- JWT token w localStorage (HttpOnly cookies w produkcji)
- Token refresh mechanism (w późniejszej fazie)
- Auto logout po wygaśnięciu tokenu (401 → redirect /login)

#### Data validation:

- Client-side validation (Zod schemas)
- Server-side validation (mandatory - API layer)
- Never trust client input

### 10.2. Protected routes implementation

#### Middleware check:

```typescript
// src/middleware/index.ts
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async ({ request, redirect, locals }, next) => {
  const url = new URL(request.url);
  const token = request.headers.get("cookie")?.match(/auth_token=([^;]+)/)?.[1];

  const publicPaths = ["/login", "/register", "/"];
  const isPublic = publicPaths.includes(url.pathname);

  if (!token && !isPublic) {
    return redirect("/login");
  }

  if (token && (url.pathname === "/login" || url.pathname === "/register")) {
    return redirect("/dashboard");
  }

  // Verify token (mock w MVP, later: Supabase Auth)
  locals.user = token ? { id: "mock_user_id", email: "user@example.com" } : null;

  return next();
});
```

## 11. Performance

### 11.1. Optymalizacje w MVP

#### Co implementujemy:

- **Image optimization**: Astro built-in (dla logo, avatarów)
- **Code splitting**: Astro automatycznie splituje komponenty z `client:load`
- **Minimal JavaScript**: Tylko React components gdzie potrzeba interaktywności
- **CSS optimization**: Tailwind JIT, purge unused styles

#### Czego NIE implementujemy w MVP:

- Lazy loading komponentów (wszystkie eager load)
- Virtual scrolling dla długich list
- Service workers / PWA
- Image lazy loading (może być w przyszłości)
- Caching API responses
- Optimistic UI updates

### 11.2. Loading strategies

#### Astro islands architecture:

```astro
<!-- Eager hydration dla krytycznych komponentów -->
<FlashcardGrid client:load flashcards={data} />

<!-- W przyszłości: Lazy hydration -->
<GenerationList client:visible generations={data} />
```

#### Bundle size optimization:

- Tylko potrzebne shadcn/ui components
- Tree-shaking włączony
- No unused dependencies

## 12. Responsywność (Future Enhancement)

### 12.1. Breakpoints (Tailwind default)

```css
/* Desktop-first w MVP, ale zachować breakpoints dla przyszłości */
sm: 640px   /* Smartphone */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### 12.2. Mobile adaptacja (poza MVP)

#### Co będzie wymagało adaptacji w przyszłości:

- **Dashboard**: Stack kafelki vertically (1 kolumna)
- **FlashcardGrid**: 3 → 2 → 1 kolumny
- **Hamburger menu**: Replace dashboard tiles z persistent navigation
- **Touch gestures**: Swipe do flip karty
- **Bottom navigation**: Tab bar dla głównych sekcji

## 13. Dark Mode

### 13.1. Implementacja

#### Toggle w header:

```typescript
// DarkModeToggle.tsx
function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <Button variant="ghost" onClick={() => setIsDark(!isDark)}>
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
```

#### Tailwind dark mode classes:

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <Card className="border-gray-200 dark:border-gray-800">{/* Content */}</Card>
</div>
```

### 13.2. Design tokens dla dark mode

```javascript
// tailwind.config.js
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light mode
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222.2 84% 4.9%)",
        // Dark mode (automatic via CSS variables)
        // .dark class switches values
      },
    },
  },
};
```

## 14. Przypadki brzegowe i stany błędów

### 14.1. Empty states

#### Empty state scenarios:

1. **Dashboard - nowy użytkownik**: Wszystkie statystyki = 0, CTA "Zacznij od wygenerowania fiszek"
2. **/flashcards - brak fiszek**: EmptyState z tekstem "Nie masz jeszcze żadnych fiszek" + button "Dodaj pierwszą fiszkę"
3. **/generations - brak generacji**: EmptyState "Nie masz jeszcze żadnych generacji" + button "Generuj fiszki"
4. **/study - brak fiszek**: "Dodaj fiszki aby rozpocząć naukę" + button "Moje fiszki"

### 14.2. Error states

#### Network errors:

- Toast: "Sprawdź połączenie internetowe"
- Retry button w toast
- No automatic retry (user-initiated)

#### API errors (per kod):

- **400**: Inline errors przy polach formularza
- **401**: Toast + auto redirect do /login
- **404**: "Nie znaleziono zasobu"
- **409**: Dedykowane komunikaty (duplicate flashcard, duplicate generation z linkiem)
- **422**: Inline validation errors
- **429**: "Przekroczono limit żądań. Spróbuj za {time}"
- **500/503**: "Problem z serwerem. Spróbuj ponownie" + retry button

#### Form validation errors:

- Inline errors pod polem (red text)
- Disable submit button gdy błędy
- Real-time validation (onChange dla character counter)

### 14.3. Loading states

#### Długie operacje (generowanie AI):

- Full screen loading overlay z:
  - Spinner
  - Tekst: "Generowanie fiszek... To może potrwać kilka sekund"
  - Optional: Cancel button (przerwij operację)

#### Listy (flashcards, generations):

- Skeleton placeholders (kształt karty/wiersza)
- Smooth transition do rzeczywistych danych

### 14.4. Edge cases

#### Przypadki brzegowe do obsługi:

1. **Token wygasł podczas sesji**: 401 → toast + redirect /login
2. **Duplicate generation (409)**: Toast z linkiem "Zobacz istniejącą generację" → /generations/{id}
3. **Rate limit (429)**: Toast z czasem do odczekania
4. **Bardzo długi tekst w fiszce**: CSS text-overflow: ellipsis + tooltip z pełną treścią
5. **Brak fiszek ready for review w /study**: "Wszystkie fiszki przejrzane! Wróć później" + button "Dashboard"
6. **User edytuje propozycję i result przekracza limit znaków**: Inline validation, disable save
7. **Network offline podczas operacji**: Toast "Brak połączenia" + możliwość retry po reconnect

## 15. Mapowanie User Stories do UI

### 15.1. Mapowanie historyjek użytkownika

#### US-001: Rejestracja konta

- **Widoki**: `/register`
- **Komponenty**: RegisterForm
- **API**: `POST /api/auth/register` (mock)
- **Flow**: Formularz → Submit → Auto-login → Redirect /dashboard

#### US-002: Logowanie do aplikacji

- **Widoki**: `/login`
- **Komponenty**: LoginForm
- **API**: `POST /api/auth/login` (mock)
- **Flow**: Formularz → Submit → Redirect /dashboard

#### US-003: Generowanie fiszek przy użyciu AI

- **Widoki**: `/generate`
- **Komponenty**: GenerateForm, LoadingSpinner
- **API**: `POST /api/generations`
- **Flow**: Textarea → Walidacja → Submit → Loading → ProposalList
- **Error handling**: 409, 422, 500, 503

#### US-004: Przegląd i zatwierdzanie propozycji fiszek

- **Widoki**: `/generate` (druga część strony)
- **Komponenty**: ProposalList, ProposalCard
- **API**: `POST /api/flashcards` (batch)
- **Flow**: Checkboxes → Optional edits → Save selected → Toast sukcesu

#### US-005: Edycja fiszek

- **Widoki**: `/flashcards`
- **Komponenty**: FlashcardCard (edit action), FlashcardDialog, FlashcardForm
- **API**: `PUT /api/flashcards/{id}`
- **Flow**: Click edit → Dialog → Form → Save → List refresh

#### US-006: Usuwanie fiszek

- **Widoki**: `/flashcards`
- **Komponenty**: FlashcardCard (delete action), DeleteConfirmDialog
- **API**: `DELETE /api/flashcards/{id}`
- **Flow**: Click delete → Confirm dialog → Delete → List refresh

#### US-007: Ręczne tworzenie fiszek

- **Widoki**: `/flashcards`
- **Komponenty**: Button "Dodaj fiszkę", FlashcardDialog, FlashcardForm
- **API**: `POST /api/flashcards`
- **Flow**: Click "Dodaj" → Dialog → Form → Save → List refresh

#### US-008: Sesja nauki z algorytmem powtórek

- **Widoki**: `/study`
- **Komponenty**: StudySession, StudyCard, StudyControls
- **API**: `GET /api/flashcards` (fetch all)
- **Flow**: Start → Show front → Flip → Rate → Next → Repeat → End
- **Algorytm**: SM-2 w localStorage

#### US-009: Bezpieczny dostęp i autoryzacja

- **Widoki**: Wszystkie protected routes
- **Implementacja**: Middleware check JWT token
- **Flow**: Every request → Check token → Allow/Redirect
- **Security**: RLS w bazie (later), user-specific queries

## 16. Pain Points użytkownika i rozwiązania UI

### 16.1. Problem: Manualne tworzenie fiszek jest czasochłonne

**Rozwiązanie UI**:

- Prominent CTA "Generuj fiszki" na dashboard (pierwszy kafelek)
- Prosty, jednokrokowy flow generowania (jedna strona)
- Real-time feedback (licznik znaków, validation)
- Szybkie akceptowanie wszystkich propozycji (domyślnie wszystkie checked)

### 16.2. Problem: Trudno ocenić jakość wygenerowanych fiszek

**Rozwiązanie UI**:

- Lista propozycji pokazuje front/back obok siebie
- Możliwość inline edycji przed zapisem
- Checkboxes do selekcji (odrzucenie złych propozycji)
- Badge "AI" dla transparentności źródła

### 16.3. Problem: Nuda podczas nauki (low engagement)

**Rozwiązanie UI**:

- Full-screen distraction-free mode
- Smooth animations (flip effect)
- Progress tracking (motivacja)
- Keyboard shortcuts dla power users
- Gamification w przyszłości (poza MVP)

### 16.4. Problem: Brak widoczności postępów w nauce

**Rozwiązanie UI**:

- Dashboard ze statystykami (total fiszek, generacje, wskaźnik akceptacji)
- Progress bar w sesji nauki
- Historia generacji z acceptance rates
- Algorytm SM-2 trackuje postępy (localStorage w MVP)

### 16.5. Problem: Zagubienie się w aplikacji (unclear navigation)

**Rozwiązanie UI**:

- Dashboard jako centralny hub (wszystkie drogi prowadzą tu)
- Duże, jasne kafelki menu z ikonami i opisami
- Logo zawsze wraca do dashboard
- Flat routing (no nested complexity)

### 16.6. Problem: Frustracja przy błędach API

**Rozwiązanie UI**:

- User-friendly error messages (PL, bez tech jargon)
- Retry buttons dla 500/503
- Link do istniejącej generacji przy 409
- Loading indicators dla długich operacji
- Toast notifications (non-blocking)

## 17. Podsumowanie architektury

### 17.1. Kluczowe decyzje architektoniczne

1. **Desktop-first MVP**: Focus na desktop experience, mobile w przyszłości
2. **Dashboard-centric navigation**: Hub model zamiast persistent sidebar
3. **Astro SSR + React islands**: Optymalna performance przy zachowaniu interaktywności
4. **Mock authentication**: Uproszczony flow w MVP, pełna integracja z Supabase Auth później
5. **No global state**: Local React hooks, localStorage dla persystencji
6. **Shadcn/ui components**: Spójny design system out-of-the-box
7. **Dark mode support**: Tailwind class strategy z localStorage persistence
8. **SM-2 algorithm client-side**: localStorage tracking w MVP, backend w przyszłości
9. **Klasyczna paginacja**: 50/page dla fiszek, 20/page dla generacji
10. **No caching/optimistic updates**: Simple fetch-on-demand w MVP

### 17.2. Ścieżka dalszego rozwoju (post-MVP)

#### Immediate next steps:

- [ ] Implementacja Supabase Auth (replace mock)
- [ ] Backend endpoint `/api/stats` dla dashboard
- [ ] Backend tracking dla sesji nauki (replace localStorage)
- [ ] Search functionality w `/flashcards`
- [ ] Mobile responsive design

#### Future enhancements:

- [ ] Advanced filtering i sorting
- [ ] Export fiszek (Anki, CSV)
- [ ] Shared flashcard decks
- [ ] Tags i categories
- [ ] Advanced statistics dashboard
- [ ] Gamification (streaks, achievements)
- [ ] Spaced repetition metadata w bazie
- [ ] Progressive Web App (offline support)
- [ ] Mobile apps (React Native)

### 17.3. Metryki sukcesu UI

#### Measuring UX effectiveness:

1. **Time to first flashcard generated**: Cel < 2 minuty od rejestracji
2. **Acceptance rate**: 75% wygenerowanych fiszek zaakceptowanych
3. **Session completion rate**: % ukończonych sesji nauki
4. **Feature discovery**: % użytkowników odwiedzających wszystkie 4 główne widoki
5. **Error rate**: < 5% requests z błędami API
6. **Load time**: < 2s dla każdego widoku

## 18. Nierozstrzygnięte kwestie (do decyzji przed implementacją)

### 18.1. Wymagające natychmiastowej decyzji:

1. **Landing page**:
   - Option A: Publiczna landing page z CTA na "/" → /login
   - Option B: Redirect "/" → /login jeśli nie zalogowany, → /dashboard jeśli zalogowany
   - **Rekomendacja**: Option B (MVP simplicity)

2. **Stats endpoint**:
   - Option A: Backend `/api/stats` (dedykowany endpoint)
   - Option B: Frontend agregacja z istniejących endpointów
   - **Rekomendacja**: Option B dla MVP, Option A later

3. **Edycja propozycji w /generate**:
   - Option A: Inline inputs (contentEditable style)
   - Option B: Click button → otwiera input
   - **Rekomendacja**: Option A (faster UX)

4. **Po zapisaniu fiszek**:
   - Option A: Zostać na /generate, wyczyścić formularz
   - Option B: Redirect do /flashcards
   - **Rekomendacja**: Option A (możliwość kolejnej generacji)

5. **Source text w szczegółach generacji**:
   - Option A: Pokazać pełny tekst z collapse/expand
   - Option B: Nie pokazywać (może być długi)
   - **Rekomendacja**: Option A z collapse (transparency)

### 18.2. Można odłożyć:

6. **Search w /flashcards**: Odłożyć poza MVP
7. **User settings page**: Odłożyć poza MVP (tylko "Wyloguj się" w dropdown)
8. **Activity timeline na dashboard**: Odłożyć poza MVP
9. **Custom logo graficzne**: Zostać przy tekstowym "10x cards" w MVP
10. **Keyboard shortcuts lista**: Dokumentacja później, podstawowe (1-4, Space, Enter) w MVP

---

**Dokument stworzony**: 2025-10-07  
**Wersja**: 1.0 (MVP)  
**Status**: Ready for implementation
