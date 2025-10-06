# API Endpoint Implementation Plan: Flashcards Management

## 1. Przegląd punktu końcowego

System zarządzania fiszkami (flashcards) składa się z 5 endpointów REST API umożliwiających pełne operacje CRUD:

- **GET /api/flashcards** - Pobieranie listy fiszek z paginacją, filtrowaniem i wyszukiwaniem
- **GET /api/flashcards/{id}** - Pobieranie szczegółów pojedynczej fiszki
- **POST /api/flashcards** - Tworzenie pojedynczej fiszki lub batch (wiele fiszek naraz)
- **PUT /api/flashcards/{id}** - Aktualizacja istniejącej fiszki
- **DELETE /api/flashcards/{id}** - Usuwanie fiszki

Fiszki mogą pochodzić z trzech źródeł:
- `ai-full` - wygenerowane przez AI i zaakceptowane bez edycji
- `ai-edited` - wygenerowane przez AI i edytowane przed zaakceptowaniem
- `manual` - utworzone ręcznie przez użytkownika

---

## 2. Szczegóły żądania

### 2.1 GET /api/flashcards (Lista fiszek)

**Metoda HTTP:** GET  
**Struktura URL:** `/api/flashcards?page={page}&limit={limit}&source={source}&search={search}`

**Parametry:**
- **Opcjonalne:**
  - `page` (number) - numer strony, default: 1
  - `limit` (number) - liczba elementów na stronę, default: 50, max: 100
  - `source` (string) - filtr po źródle: `ai-full`, `ai-edited`, `manual`
  - `search` (string) - wyszukiwanie w polach front/back

**Request Body:** Brak

---

### 2.2 GET /api/flashcards/{id} (Szczegóły fiszki)

**Metoda HTTP:** GET  
**Struktura URL:** `/api/flashcards/{id}`

**Parametry:**
- **Wymagane:**
  - `id` (number) - identyfikator fiszki (BIGINT)

**Request Body:** Brak

---

### 2.3 POST /api/flashcards (Tworzenie fiszek)

**Metoda HTTP:** POST  
**Struktura URL:** `/api/flashcards`

**Parametry:** Brak

**Request Body (single flashcard):**
```json
{
  "front": "string (max 200 chars)",
  "back": "string (max 500 chars)",
  "source": "ai-full | ai-edited | manual",
  "generation_id": number | null (optional)
}
```

**Request Body (batch flashcards):**
```json
{
  "flashcards": [
    {
      "front": "string (max 200 chars)",
      "back": "string (max 500 chars)",
      "source": "ai-full | ai-edited | manual",
      "generation_id": number | null (optional)
    }
  ]
}
```

---

### 2.4 PUT /api/flashcards/{id} (Aktualizacja fiszki)

**Metoda HTTP:** PUT  
**Struktura URL:** `/api/flashcards/{id}`

**Parametry:**
- **Wymagane:**
  - `id` (number) - identyfikator fiszki (BIGINT)

**Request Body:**
```json
{
  "front": "string (max 200 chars, optional)",
  "back": "string (max 500 chars, optional)"
}
```

**Uwaga:** Gdy aktualizujemy fiszkę z source `ai-full`, automatycznie zmienia się na `ai-edited`

---

### 2.5 DELETE /api/flashcards/{id} (Usuwanie fiszki)

**Metoda HTTP:** DELETE  
**Struktura URL:** `/api/flashcards/{id}`

**Parametry:**
- **Wymagane:**
  - `id` (number) - identyfikator fiszki (BIGINT)

**Request Body:** Brak

---

## 3. Wykorzystywane typy

### 3.1 Typy DTO (z types.ts)

**FlashcardDTO** - obiekt zwracany przez API
```typescript
type FlashcardDTO = Omit<FlashcardEntity, 'user_id'>;
// Pola: id, front, back, source, generation_id, created_at, updated_at
```

**FlashcardCreateCommand** - dane do utworzenia pojedynczej fiszki
```typescript
type FlashcardCreateCommand = {
  front: string;
  back: string;
  source: FlashcardSource;
  generation_id?: number | null;
};
```

**FlashcardBatchCreateCommand** - dane do batch create
```typescript
type FlashcardBatchCreateCommand = {
  flashcards: FlashcardCreateCommand[];
};
```

**FlashcardUpdateCommand** - dane do aktualizacji
```typescript
type FlashcardUpdateCommand = {
  front?: string;
  back?: string;
};
```

**FlashcardListQuery** - parametry zapytania dla listy
```typescript
type FlashcardListQuery = {
  page?: number;
  limit?: number;
  source?: FlashcardSource;
  search?: string;
};
```

**FlashcardListResponse** - odpowiedź z listą i paginacją
```typescript
type FlashcardListResponse = PaginatedResponse<FlashcardDTO>;
```

### 3.2 Typy wewnętrzne (database operations)

**FlashcardInsert** - insert do bazy danych (zawiera user_id)
```typescript
type FlashcardInsert = TablesInsert<'flashcards'>;
```

**FlashcardUpdate** - update w bazie danych
```typescript
type FlashcardUpdate = TablesUpdate<'flashcards'>;
```

---

## 4. Szczegóły odpowiedzi

### 4.1 GET /api/flashcards (200 OK)
```json
{
  "data": [
    {
      "id": 123,
      "front": "What is TypeScript?",
      "back": "A statically typed superset of JavaScript",
      "source": "ai-full",
      "generation_id": 45,
      "created_at": "2025-10-06T10:00:00Z",
      "updated_at": "2025-10-06T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "total_pages": 3
  }
}
```

### 4.2 GET /api/flashcards/{id} (200 OK)
```json
{
  "id": 123,
  "front": "What is TypeScript?",
  "back": "A statically typed superset of JavaScript",
  "source": "ai-full",
  "generation_id": 45,
  "created_at": "2025-10-06T10:00:00Z",
  "updated_at": "2025-10-06T10:00:00Z"
}
```

### 4.3 POST /api/flashcards (201 Created)
```json
{
  "data": [
    {
      "id": 124,
      "front": "What is React?",
      "back": "A JavaScript library for building user interfaces",
      "source": "manual",
      "generation_id": null,
      "created_at": "2025-10-06T11:00:00Z",
      "updated_at": "2025-10-06T11:00:00Z"
    }
  ]
}
```

### 4.4 PUT /api/flashcards/{id} (200 OK)
```json
{
  "id": 123,
  "front": "What is TypeScript? (Updated)",
  "back": "A strongly typed programming language that builds on JavaScript",
  "source": "ai-edited",
  "generation_id": 45,
  "created_at": "2025-10-06T10:00:00Z",
  "updated_at": "2025-10-06T11:30:00Z"
}
```

### 4.5 DELETE /api/flashcards/{id} (204 No Content)
Brak body w odpowiedzi.

---

## 5. Przepływ danych

### 5.1 GET /api/flashcards (Lista)
```
1. Walidacja query params (Zod schema)
2. Parsowanie i sanityzacja parametrów (page, limit, source, search)
3. Pobranie user_id z context.locals (MVP: hardcoded test user)
4. Wywołanie flashcardService.listFlashcards(supabase, userId, query)
5. Service buduje zapytanie SQL:
   - WHERE user_id = {userId}
   - AND source = {source} (jeśli podany)
   - AND (front ILIKE %{search}% OR back ILIKE %{search}%) (jeśli search)
   - ORDER BY created_at DESC
   - LIMIT {limit} OFFSET {(page-1)*limit}
6. Pobranie count(*) dla pagination.total
7. Obliczenie total_pages = ceil(total / limit)
8. Mapowanie wyników do FlashcardDTO (usunięcie user_id)
9. Zwrot 200 z data[] i pagination{}
```

### 5.2 GET /api/flashcards/{id} (Szczegóły)
```
1. Walidacja i parsowanie id z URL
2. Pobranie user_id z context.locals
3. Wywołanie flashcardService.getFlashcardById(supabase, userId, id)
4. Service: SELECT * FROM flashcards WHERE id = {id} AND user_id = {userId}
5. Jeśli brak wyniku → throw NotFoundError
6. Mapowanie do FlashcardDTO
7. Zwrot 200 z obiektem fiszki
```

### 5.3 POST /api/flashcards (Tworzenie)
```
1. Walidacja request body (Zod):
   - Sprawdź czy single (ma front, back) czy batch (ma flashcards[])
2. Pobranie user_id z context.locals
3. Sanityzacja danych (trim, escape HTML)
4. Sprawdzenie duplikatów dla każdej fiszki:
   - SELECT id FROM flashcards WHERE user_id={userId} AND front={front} AND back={back}
   - Jeśli istnieje → throw ConflictError
5. Jeśli batch i flashcards mają generation_id:
   - Rozpocznij transakcję DB
   - INSERT flashcards (batch insert)
   - UPDATE generations SET accepted_unedited_count += X, accepted_edited_count += Y
   - Commit transakcji
6. Jeśli single lub manual:
   - INSERT pojedyncza fiszka
7. Mapowanie wyników do FlashcardDTO[]
8. Zwrot 201 z { data: [...] }
```

### 5.4 PUT /api/flashcards/{id} (Aktualizacja)
```
1. Walidacja id z URL
2. Walidacja request body (front i/lub back)
3. Pobranie user_id z context.locals
4. Pobranie istniejącej fiszki: getFlashcardById(supabase, userId, id)
5. Sprawdzenie czy aktualizacja nie stworzy duplikatu (z nowymi wartościami)
6. Przygotowanie updateData:
   - Dodaj front i/lub back (jeśli podane)
   - Jeśli original source === 'ai-full' && (front || back changed) → source = 'ai-edited'
7. UPDATE flashcards SET ... WHERE id={id} AND user_id={userId}
8. Pobranie zaktualizowanej fiszki
9. Mapowanie do FlashcardDTO
10. Zwrot 200 z zaktualizowanym obiektem
```

### 5.5 DELETE /api/flashcards/{id} (Usuwanie)
```
1. Walidacja id z URL
2. Pobranie user_id z context.locals
3. Sprawdzenie czy fiszka istnieje: getFlashcardById(supabase, userId, id)
4. DELETE FROM flashcards WHERE id={id} AND user_id={userId}
5. Zwrot 204 No Content
```

---

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie i autoryzacja (MVP)
- **RLS DISABLED dla MVP** - uproszczenie developmentu
- user_id jest hardcoded jako test user (z migracji 20251006180100_create_test_user.sql)
- W przyszłości: aktywować RLS i używać auth.uid() z Supabase Auth
- Middleware sprawdza context.locals.supabase

### 6.2 Walidacja danych wejściowych
- **Zod schemas** dla wszystkich inputów:
  - Typy danych (string, number, enum)
  - Limity długości (front max 200, back max 500)
  - Wymagalność pól
  - Enum values dla source
- **Sanityzacja:**
  - `.trim()` dla wszystkich stringów
  - Escape HTML tags lub strip (zapobieganie XSS)
  - Normalizacja białych znaków

### 6.3 SQL Injection
- Używamy Supabase client z parametryzowanymi zapytaniami
- NIGDY nie konkatenujemy user input do SQL

### 6.4 Unique Constraint
- Database constraint: `UNIQUE(user_id, front, back)`
- Zapobiega duplikatom na poziomie DB
- Obsługa konfliktu zwraca 409 Conflict

### 6.5 Rate Limiting (opisane w spec, nie zaimplementowane w MVP)
- Future: 100 requests/min dla flashcard endpoints
- Middleware rate limiting based on user_id lub IP

### 6.6 Security Headers
W Astro middleware dodać headers:
```typescript
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');
```

---

## 7. Obsługa błędów

### 7.1 Kody błędów i scenariusze

#### 400 Bad Request
**Kiedy:**
- Nieprawidłowe query parameters (page < 1, limit > 100, invalid source value)
- Nieprawidłowy request body (brak wymaganych pól, złe typy)
- Invalid JSON w body

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "limit",
      "constraint": "max_value",
      "max": 100,
      "actual": 150
    }
  }
}
```

#### 404 Not Found
**Kiedy:**
- Fiszka o podanym ID nie istnieje
- Fiszka istnieje ale należy do innego użytkownika (RLS w przyszłości)

**Response:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Flashcard not found"
  }
}
```

#### 409 Conflict
**Kiedy:**
- Próba utworzenia fiszki z identycznym front i back (duplikat)
- Próba aktualizacji która stworzyłaby duplikat

**Response:**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Flashcard with this front and back already exists",
    "details": {
      "existing_id": 123
    }
  }
}
```

#### 422 Unprocessable Entity
**Kiedy:**
- front > 200 znaków
- back > 500 znaków
- source nie jest jednym z: ai-full, ai-edited, manual
- generation_id podany dla source=manual
- generation_id nie istnieje w generations table

**Response:**
```json
{
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "message": "Front text exceeds maximum length",
    "details": {
      "field": "front",
      "constraint": "max_length",
      "max": 200,
      "actual": 215
    }
  }
}
```

#### 500 Internal Server Error
**Kiedy:**
- Błąd połączenia z bazą danych
- Nieoczekiwany błąd w aplikacji
- Błąd transakcji (batch insert z update generations)

**Response:**
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

### 7.2 Hierarchia obsługi błędów

```
1. Zod Validation Error → 400 Bad Request
2. NotFoundError (custom) → 404 Not Found  
3. ConflictError (custom) → 409 Conflict
4. UnprocessableEntityError (custom) → 422 Unprocessable Entity
5. Database unique constraint violation → 409 Conflict
6. Database foreign key violation → 422 Unprocessable Entity
7. Inne błędy → 500 Internal Server Error
```

### 7.3 Logowanie błędów
- Wszystkie błędy 500 logowane do console.error
- Błędy zawierają stack trace w dev, usunięty w production
- Nie logujemy błędów walidacji (400, 422) - to oczekiwane błędy
- Używamy custom error classes z src/lib/utils/errors.ts

---

## 8. Rozważania dotyczące wydajności

### 8.1 Indeksy bazodanowe (już w migracji)
- B-Tree index na `(user_id, created_at DESC)` - szybkie sortowanie i paginacja
- Unique index na `(user_id, front, back)` - szybkie sprawdzanie duplikatów
- Opcjonalnie: GIN trigram index na `front` i `back` dla full-text search

### 8.2 Paginacja
- Limit domyślny: 50 items
- Max limit: 100 items
- Offset-based pagination (page * limit)
- W przyszłości: cursor-based pagination dla lepszej wydajności z dużymi datasetami

### 8.3 Query optimization
- SELECT tylko potrzebne kolumny (nie SELECT *)
- COUNT query osobno (możliwe cache w przyszłości)
- Batch operations w transakcjach (atomic + szybsze)

### 8.4 Potencjalne wąskie gardła
- Search query z ILIKE może być wolny dla dużych tabel
  - Rozwiązanie: pg_trgm + GIN index
- Batch insert z update generations - transakcja może być długa
  - Rozwiązanie: limit batch size (max 50 flashcards?)
- Count(*) dla pagination może być wolny
  - Rozwiązanie: cache total count lub estimated count

### 8.5 Caching (future)
- Cache count(*) results (invalidate on insert/delete)
- Cache frequently accessed flashcards
- Use Supabase Realtime for invalidation

### 8.6 Connection pooling
- Supabase ma wbudowany connection pooling
- Używamy `context.locals.supabase` - reuse connection w request lifecycle

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematów walidacji Zod
**Plik:** `src/lib/validation/flashcard.schemas.ts`

1. Zaimportować `z` z `zod`
2. Utworzyć `flashcardSourceEnum` = `z.enum(['ai-full', 'ai-edited', 'manual'])`
3. Utworzyć `flashcardListQuerySchema`:
   - page: `z.coerce.number().int().min(1).optional().default(1)`
   - limit: `z.coerce.number().int().min(1).max(100).optional().default(50)`
   - source: `flashcardSourceEnum.optional()`
   - search: `z.string().min(1).max(200).optional()`
4. Utworzyć `flashcardCreateSchema`:
   - front: `z.string().trim().min(1).max(200)`
   - back: `z.string().trim().min(1).max(500)`
   - source: `flashcardSourceEnum`
   - generation_id: `z.number().int().positive().nullable().optional()`
5. Utworzyć `flashcardBatchCreateSchema`:
   - flashcards: `z.array(flashcardCreateSchema).min(1).max(50)`
6. Utworzyć `flashcardUpdateSchema`:
   - front: `z.string().trim().min(1).max(200).optional()`
   - back: `z.string().trim().min(1).max(500).optional()`
   - Dodać `.refine()` żeby przynajmniej jedno pole było podane
7. Utworzyć `flashcardIdParamSchema`:
   - id: `z.coerce.number().int().positive()`

### Krok 2: Utworzenie serwisu flashcardService
**Plik:** `src/lib/services/flashcardService.ts`

1. Zaimportować typy: SupabaseClient, FlashcardDTO, FlashcardCreateCommand, etc.
2. Utworzyć `listFlashcards()`:
   ```typescript
   async function listFlashcards(
     supabase: SupabaseClient,
     userId: string,
     query: FlashcardListQuery
   ): Promise<FlashcardListResponse>
   ```
   - Buduj query z where user_id
   - Dodaj filter source (jeśli podany)
   - Dodaj search ILIKE (jeśli podany): `.or('front.ilike.%'+search+'%,back.ilike.%'+search+'%')`
   - Order by created_at desc
   - Range dla paginacji: `.range(offset, offset + limit - 1)`
   - Osobny count query
   - Return data + pagination

3. Utworzyć `getFlashcardById()`:
   ```typescript
   async function getFlashcardById(
     supabase: SupabaseClient,
     userId: string,
     id: number
   ): Promise<FlashcardDTO>
   ```
   - SELECT where id AND user_id
   - Throw NotFoundError jeśli brak
   - Return flashcard

4. Utworzyć `checkDuplicate()`:
   ```typescript
   async function checkDuplicate(
     supabase: SupabaseClient,
     userId: string,
     front: string,
     back: string,
     excludeId?: number
   ): Promise<boolean>
   ```
   - SELECT id WHERE user_id AND front AND back
   - Jeśli excludeId podany: AND id != excludeId
   - Return true jeśli znaleziono

5. Utworzyć `createFlashcard()`:
   ```typescript
   async function createFlashcard(
     supabase: SupabaseClient,
     userId: string,
     command: FlashcardCreateCommand
   ): Promise<FlashcardDTO>
   ```
   - Sanityzuj input (trim już w Zod)
   - Sprawdź duplikaty
   - INSERT flashcard z user_id
   - Return created flashcard

6. Utworzyć `createFlashcardsBatch()`:
   ```typescript
   async function createFlashcardsBatch(
     supabase: SupabaseClient,
     userId: string,
     commands: FlashcardCreateCommand[],
     generationId?: number
   ): Promise<FlashcardDTO[]>
   ```
   - Sprawdź duplikaty dla każdej
   - Rozpocznij transakcję (Supabase .rpc() lub multiple operations)
   - Batch INSERT flashcards
   - Jeśli generationId: UPDATE generations statistics
   - Commit
   - Return created flashcards

7. Utworzyć `updateFlashcard()`:
   ```typescript
   async function updateFlashcard(
     supabase: SupabaseClient,
     userId: string,
     id: number,
     command: FlashcardUpdateCommand
   ): Promise<FlashcardDTO>
   ```
   - Pobierz istniejącą fiszkę
   - Sprawdź czy update nie tworzy duplikatu
   - Określ czy source zmienia się na 'ai-edited'
   - UPDATE flashcard
   - Return updated flashcard

8. Utworzyć `deleteFlashcard()`:
   ```typescript
   async function deleteFlashcard(
     supabase: SupabaseClient,
     userId: string,
     id: number
   ): Promise<void>
   ```
   - Sprawdź czy fiszka istnieje (getById)
   - DELETE where id AND user_id
   - Return void

9. Eksportuj wszystkie funkcje

### Krok 3: Utworzenie endpoint GET /api/flashcards
**Plik:** `src/pages/api/flashcards/index.ts`

1. Zaimportować dependencies
2. Dodać `export const prerender = false`
3. Utworzyć handler `GET()`:
   ```typescript
   export async function GET(context: APIContext): Promise<Response>
   ```
4. W try-catch:
   - Pobierz supabase z context.locals
   - Parsuj query params przez Zod schema
   - Pobierz userId (hardcoded test user dla MVP)
   - Wywołaj flashcardService.listFlashcards()
   - Return new Response(JSON.stringify(result), { status: 200 })
5. Obsłuż błędy z Zod i inne
6. Return odpowiednie error responses

### Krok 4: Utworzenie endpoint POST /api/flashcards
**W tym samym pliku:** `src/pages/api/flashcards/index.ts`

1. Utworzyć handler `POST()`:
   ```typescript
   export async function POST(context: APIContext): Promise<Response>
   ```
2. W try-catch:
   - Parsuj request body (await request.json())
   - Określ czy single czy batch (sprawdź czy ma 'flashcards' key)
   - Waliduj przez odpowiedni Zod schema
   - Pobierz userId
   - Jeśli single: wywołaj createFlashcard()
   - Jeśli batch: wywołaj createFlashcardsBatch()
   - Return 201 Created z { data: [...] }
3. Obsłuż błędy (validation, conflict, etc.)

### Krok 5: Utworzenie endpoint GET /api/flashcards/[id].ts
**Plik:** `src/pages/api/flashcards/[id].ts`

1. Dodać `export const prerender = false`
2. Utworzyć handler `GET()`:
   ```typescript
   export async function GET(context: APIContext): Promise<Response>
   ```
3. W try-catch:
   - Pobierz id z context.params.id
   - Waliduj przez flashcardIdParamSchema
   - Pobierz userId
   - Wywołaj flashcardService.getFlashcardById()
   - Return 200 z flashcard object
4. Obsłuż NotFoundError → 404

### Krok 6: Utworzenie endpoint PUT /api/flashcards/[id].ts
**W tym samym pliku:** `src/pages/api/flashcards/[id].ts`

1. Utworzyć handler `PUT()`:
   ```typescript
   export async function PUT(context: APIContext): Promise<Response>
   ```
2. W try-catch:
   - Pobierz i waliduj id
   - Parsuj i waliduj body przez flashcardUpdateSchema
   - Pobierz userId
   - Wywołaj flashcardService.updateFlashcard()
   - Return 200 z updated flashcard
3. Obsłuż błędy (NotFound, Conflict, Validation)

### Krok 7: Utworzenie endpoint DELETE /api/flashcards/[id].ts
**W tym samym pliku:** `src/pages/api/flashcards/[id].ts`

1. Utworzyć handler `DELETE()`:
   ```typescript
   export async function DELETE(context: APIContext): Promise<Response>
   ```
2. W try-catch:
   - Pobierz i waliduj id
   - Pobierz userId
   - Wywołaj flashcardService.deleteFlashcard()
   - Return 204 No Content (new Response(null, { status: 204 }))
3. Obsłuż NotFoundError → 404

### Krok 8: Dodanie funkcji pomocniczych do utils
**Rozszerzyć:** `src/lib/utils/errors.ts` (jeśli potrzebne nowe error classes)

1. Sprawdź czy istnieją:
   - NotFoundError
   - ConflictError
   - ValidationError
   - UnprocessableEntityError
2. Dodaj brakujące (na podstawie istniejącego kodu)
3. Upewnij się że mają odpowiednie statusy HTTP

### Krok 9: Testowanie endpointów
**Narzędzia:** Thunder Client, Postman, lub curl

1. Test GET /api/flashcards
   - Bez params (default pagination)
   - Z params: page=2, limit=10
   - Z filtrem: source=manual
   - Z search: search=TypeScript

2. Test POST /api/flashcards
   - Single flashcard (manual)
   - Batch flashcards (z generation_id)
   - Duplicate test (should return 409)
   - Validation errors (front > 200 chars)

3. Test GET /api/flashcards/{id}
   - Existing flashcard (200)
   - Non-existing (404)

4. Test PUT /api/flashcards/{id}
   - Update front only
   - Update back only
   - Update both
   - Test ai-full → ai-edited transformation
   - Test duplicate conflict

5. Test DELETE /api/flashcards/{id}
   - Existing flashcard (204)
   - Non-existing (404)
   - Verify deletion

### Krok 10: Obsługa edge cases i cleanup
1. Dodać error handling dla database connection issues
2. Dodać logging dla błędów 500
3. Weryfikować że wszystkie responses mają odpowiednie headers (Content-Type)
4. Sprawdzić czy user_id jest poprawnie używany wszędzie
5. Code review i refactoring jeśli potrzebne
6. Dodać komentarze JSDoc do funkcji serwisu

### Krok 11: Integracja z generationService (jeśli potrzebne)
1. Sprawdzić czy createFlashcardsBatch poprawnie updateuje generation statistics
2. Weryfikować że accepted_unedited_count i accepted_edited_count są poprawnie liczone
3. Test batch create z różnymi source values (ai-full vs ai-edited)

### Krok 12: Dokumentacja i finalizacja
1. Upewnić się że wszystkie funkcje mają TypeScript types
2. Sprawdzić linter errors i naprawić
3. Dodać przykłady użycia w komentarzach (jeśli potrzebne)
4. Update README jeśli aplikacja ma dokumentację API

---

## 10. Checklist implementacji

- [ ] Utworzyć `src/lib/validation/flashcard.schemas.ts` z wszystkimi schematami Zod
- [ ] Utworzyć `src/lib/services/flashcardService.ts` z pełną logiką biznesową
- [ ] Zaimplementować GET /api/flashcards (lista z paginacją)
- [ ] Zaimplementować POST /api/flashcards (single i batch)
- [ ] Zaimplementować GET /api/flashcards/[id] (szczegóły)
- [ ] Zaimplementować PUT /api/flashcards/[id] (update)
- [ ] Zaimplementować DELETE /api/flashcards/[id] (usuwanie)
- [ ] Dodać/zweryfikować error classes w errors.ts
- [ ] Przetestować wszystkie endpointy manualnie
- [ ] Przetestować edge cases (duplikaty, validation, not found)
- [ ] Sprawdzić integrację z generations (batch create + statistics update)
- [ ] Fix linter errors
- [ ] Code review i cleanup

---

## 11. Przykładowe requesty (dla testowania)

### GET /api/flashcards
```bash
curl "http://localhost:4321/api/flashcards?page=1&limit=20&source=manual"
```

### GET /api/flashcards/{id}
```bash
curl "http://localhost:4321/api/flashcards/123"
```

### POST /api/flashcards (single)
```bash
curl -X POST "http://localhost:4321/api/flashcards" \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is Astro?",
    "back": "A modern web framework",
    "source": "manual"
  }'
```

### POST /api/flashcards (batch)
```bash
curl -X POST "http://localhost:4321/api/flashcards" \
  -H "Content-Type: application/json" \
  -d '{
    "flashcards": [
      {
        "front": "What is React?",
        "back": "A JavaScript library",
        "source": "ai-full",
        "generation_id": 45
      }
    ]
  }'
```

### PUT /api/flashcards/{id}
```bash
curl -X PUT "http://localhost:4321/api/flashcards/123" \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is TypeScript? (Updated)",
    "back": "A strongly typed language"
  }'
```

### DELETE /api/flashcards/{id}
```bash
curl -X DELETE "http://localhost:4321/api/flashcards/123"
```

---

## 12. Uwagi końcowe

### MVP Considerations
- RLS jest wyłączony - używamy hardcoded test user_id
- Brak rate limiting w MVP
- Brak cachowania
- Offset-based pagination (wystarczające dla małych zbiorów)

### Future Enhancements
- Aktywacja RLS i prawdziwa autentykacja
- Rate limiting middleware
- Cursor-based pagination dla dużych zbiorów
- Full-text search z pg_trgm
- Caching strategia (Redis?)
- WebSocket notifications dla real-time updates
- Export do Anki/CSV
- Tags i categories

### Performance Targets
- GET /api/flashcards: < 200ms dla 1000 fiszek
- POST /api/flashcards: < 100ms single, < 500ms batch (50 items)
- GET /api/flashcards/{id}: < 50ms
- PUT /api/flashcards/{id}: < 100ms
- DELETE /api/flashcards/{id}: < 100ms

