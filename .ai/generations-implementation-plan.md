# Plan Implementacji API Endpoints: Generations

## 1. Przegląd punktów końcowych

### 1.1 POST /api/generations
Endpoint do generowania fiszek przy użyciu AI (OpenRouter.ai). Przyjmuje tekst źródłowy, waliduje jego długość, oblicza hash, sprawdza duplikaty, wywołuje LLM API, parsuje odpowiedź i zapisuje rekord generacji wraz z propozycjami fiszek.

### 1.2 GET /api/generations
Endpoint do pobierania paginowanej listy wszystkich generacji użytkownika, sortowanej po dacie utworzenia (najnowsze pierwsze). Zwraca statystyki akceptacji dla każdej generacji.

### 1.3 GET /api/generations/{id}
Endpoint do pobierania szczegółów pojedynczej generacji wraz z listą powiązanych fiszek, które zostały zaakceptowane przez użytkownika.

---

## 2. Szczegóły żądań

### 2.1 POST /api/generations

**Metoda HTTP:** POST

**Struktura URL:** `/api/generations`

**Parametry:**
- **Wymagane:** 
  - `source_text` (string, request body) - tekst źródłowy do analizy przez AI
    - Min: 1000 znaków
    - Max: 10000 znaków
    - Wymagany po trim

- **Opcjonalne:** Brak (model jest hardcoded jako `anthropic/claude-3.5-sonnet`)

**Request Body:**
```json
{
  "source_text": "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale..."
}
```

**Content-Type:** `application/json`

---

### 2.2 GET /api/generations

**Metoda HTTP:** GET

**Struktura URL:** `/api/generations`

**Parametry:**
- **Wymagane:** Brak

- **Opcjonalne (query params):**
  - `page` (number) - numer strony, default: 1, min: 1
  - `limit` (number) - liczba elementów na stronę, default: 20, min: 1, max: 50

**Przykładowy URL:** `/api/generations?page=2&limit=10`

---

### 2.3 GET /api/generations/{id}

**Metoda HTTP:** GET

**Struktura URL:** `/api/generations/{id}`

**Parametry:**
- **Wymagane:**
  - `id` (number, URL param) - ID generacji (BIGINT)

- **Opcjonalne:** Brak

**Przykładowy URL:** `/api/generations/46`

---

## 3. Wykorzystywane typy

### 3.1 DTOs (Data Transfer Objects)

Z `src/types.ts`:

```typescript
// Request/Response dla POST /api/generations
GenerationCreateCommand      // Request body
GenerationCreateResponse     // Response (201)
ProposedFlashcard           // Element proposed_flashcards array

// Response dla GET /api/generations
GenerationListResponse      // Paginowana lista
GenerationListQuery         // Query params
GenerationDTO              // Pojedynczy element listy

// Response dla GET /api/generations/{id}
GenerationDetailDTO        // Generacja z fiszkami

// Wspólne
PaginationMeta            // Metadane paginacji
ApiError                  // Standardowy format błędu
ApiErrorCode              // Kody błędów
ApiErrorDetail            // Szczegóły błędu
```

### 3.2 Internal Types (do użytku w serwisach)

```typescript
GenerationInsert           // Wstawianie do DB
GenerationUpdate           // Aktualizacja w DB
GenerationErrorLogInsert   // Logowanie błędów
GenerationEntity          // Raw DB entity
```

### 3.3 Validation Schemas (Zod)

Należy stworzyć w osobnym pliku `src/lib/validation/generation.schemas.ts`:

```typescript
// POST /api/generations
export const generationCreateSchema = z.object({
  source_text: z.string()
    .trim()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must not exceed 10000 characters")
});

// GET /api/generations (query params)
export const generationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

// GET /api/generations/{id}
export const generationIdSchema = z.coerce.number().int().positive();

// Walidacja pojedynczej propozycji fiszki z LLM
export const proposedFlashcardSchema = z.object({
  front: z.string().trim().min(1).max(200),
  back: z.string().trim().min(1).max(500)
});
```

---

## 4. Szczegóły odpowiedzi

### 4.1 POST /api/generations

**Sukces (201 Created):**
```json
{
  "generation": {
    "id": 46,
    "model": "anthropic/claude-3.5-sonnet",
    "generated_count": 5,
    "accepted_unedited_count": null,
    "accepted_edited_count": null,
    "source_text_hash": "a3f7b2c...",
    "source_text_length": 1250,
    "generation_duration": 3200,
    "created_at": "2025-10-06T12:00:00Z",
    "updated_at": "2025-10-06T12:00:00Z"
  },
  "proposed_flashcards": [
    {
      "front": "What is TypeScript?",
      "back": "A strongly typed programming language that builds on JavaScript",
      "source": "ai-full"
    },
    {
      "front": "What are the benefits of TypeScript?",
      "back": "Type safety, better IDE support, and early error detection",
      "source": "ai-full"
    }
  ]
}
```

**Błędy:**
- `400 Bad Request`: Nieprawidłowy JSON, brak source_text
- `422 Unprocessable Entity`: source_text poza zakresem 1000-10000 znaków
- `409 Conflict`: Generacja z tym samym hashem już istnieje
- `500 Internal Server Error`: Błąd LLM API, błąd parsowania, błąd DB
- `503 Service Unavailable`: OpenRouter.ai tymczasowo niedostępny

---

### 4.2 GET /api/generations

**Sukces (200 OK):**
```json
{
  "data": [
    {
      "id": 46,
      "model": "anthropic/claude-3.5-sonnet",
      "generated_count": 5,
      "accepted_unedited_count": 3,
      "accepted_edited_count": 1,
      "source_text_hash": "a3f7b2c...",
      "source_text_length": 1250,
      "generation_duration": 3200,
      "created_at": "2025-10-06T12:00:00Z",
      "updated_at": "2025-10-06T12:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

**Błędy:**
- `400 Bad Request`: Nieprawidłowe query params (page < 1, limit > 50)
- `500 Internal Server Error`: Błąd DB

---

### 4.3 GET /api/generations/{id}

**Sukces (200 OK):**
```json
{
  "id": 46,
  "model": "anthropic/claude-3.5-sonnet",
  "generated_count": 5,
  "accepted_unedited_count": 3,
  "accepted_edited_count": 1,
  "source_text_hash": "a3f7b2c...",
  "source_text_length": 1250,
  "generation_duration": 3200,
  "created_at": "2025-10-06T12:00:00Z",
  "updated_at": "2025-10-06T12:05:00Z",
  "flashcards": [
    {
      "id": 125,
      "front": "What is TypeScript?",
      "back": "A strongly typed programming language that builds on JavaScript",
      "source": "ai-full"
    },
    {
      "id": 126,
      "front": "What are TypeScript benefits?",
      "back": "Type safety and better tooling",
      "source": "ai-edited"
    }
  ]
}
```

**Błędy:**
- `400 Bad Request`: ID nie jest liczbą lub jest nieprawidłowe
- `404 Not Found`: Generacja nie istnieje
- `500 Internal Server Error`: Błąd DB

---

## 5. Przepływ danych

### 5.1 POST /api/generations - Szczegółowy przepływ

```
1. Request → Astro API Route (/src/pages/api/generations/index.ts)
   ↓
2. Walidacja request body (Zod schema)
   - Sprawdź czy source_text istnieje
   - Sprawdź długość (1000-10000)
   - Trim i sanitize
   ↓
3. Oblicz hash SHA-256 tekstu źródłowego (hashService)
   ↓
4. Sprawdź duplikaty w bazie (generationService.checkDuplicateHash)
   - Query: SELECT id FROM generations WHERE user_id = ? AND source_text_hash = ?
   - Jeśli istnieje → 409 Conflict
   ↓
5. Wywołaj OpenRouter.ai API (llmService.generateFlashcards)
   - Endpoint: https://openrouter.ai/api/v1/chat/completions
   - Model: anthropic/claude-3.5-sonnet
   - Pomiar czasu wywołania (generation_duration)
   - Timeout: 60 sekund
   ↓
6. Parsuj odpowiedź LLM (llmService.parseFlashcardsFromResponse)
   - Wyciągnij JSON array z response
   - Waliduj każdą propozycję (max 200/500 znaków)
   - Odfiltruj nieprawidłowe propozycje
   ↓
7. Zapisz rekord generacji do DB (generationService.createGeneration)
   - INSERT INTO generations (user_id, model, generated_count, source_text_hash, 
                               source_text_length, generation_duration)
   - accepted_unedited_count i accepted_edited_count = null
   ↓
8. Zwróć response 201 (GenerationCreateResponse)
   - generation: GenerationDTO
   - proposed_flashcards: ProposedFlashcard[]

OBSŁUGA BŁĘDÓW:
- Błąd LLM API (krok 5):
  → Loguj do generation_error_logs (errorLogService)
  → Zwróć 500 lub 503 w zależności od typu błędu
- Błąd parsowania (krok 6):
  → Loguj do generation_error_logs
  → Zwróć 500 Internal Server Error
- Błąd DB (krok 7):
  → Zwróć 500 Internal Server Error
```

### 5.2 GET /api/generations - Szczegółowy przepływ

```
1. Request → Astro API Route (/src/pages/api/generations/index.ts)
   ↓
2. Walidacja query params (Zod schema)
   - page: default 1, min 1
   - limit: default 20, min 1, max 50
   ↓
3. Pobierz listę generacji z paginacją (generationService.listGenerations)
   - Query 1: SELECT COUNT(*) FROM generations WHERE user_id = ?
   - Query 2: SELECT * FROM generations 
              WHERE user_id = ? 
              ORDER BY created_at DESC 
              LIMIT ? OFFSET ?
   ↓
4. Oblicz metadane paginacji
   - total_pages = Math.ceil(total / limit)
   ↓
5. Mapuj entities na DTOs (usuń user_id)
   ↓
6. Zwróć response 200 (GenerationListResponse)
```

### 5.3 GET /api/generations/{id} - Szczegółowy przepływ

```
1. Request → Astro API Route (/src/pages/api/generations/[id].ts)
   ↓
2. Walidacja ID z URL params (Zod schema)
   - Sprawdź czy jest liczbą
   - Sprawdź czy jest dodatnia
   ↓
3. Pobierz generację z fiszkami (generationService.getGenerationById)
   - Query: SELECT g.*, 
                   f.id as flashcard_id, f.front, f.back, f.source
            FROM generations g
            LEFT JOIN flashcards f ON f.generation_id = g.id
            WHERE g.id = ? AND g.user_id = ?
   - Jeśli brak wyników → 404 Not Found
   ↓
4. Mapuj wynik na GenerationDetailDTO
   - Zgrupuj fiszki w tablicę
   - Usuń user_id
   ↓
5. Zwróć response 200 (GenerationDetailDTO)
```

---

## 6. Względy bezpieczeństwa

### 6.1 Ochrona przed XSS
- **Sanityzacja source_text**: Escape HTML przed zapisem do DB
- **Content Security Policy**: Dodać odpowiednie nagłówki CSP
- **Output encoding**: Przy wyświetlaniu danych escape HTML/JS

### 6.2 Ochrona API Key
- **Zmienne środowiskowe**: Klucz OpenRouter.ai tylko w `OPENROUTER_API_KEY`
- **Nigdy w response**: Nie zwracać klucza w odpowiedziach API
- **Server-side only**: Wywołania LLM tylko z serwera (Astro SSR)

### 6.3 Rate Limiting
- **POST /api/generations**: 10 żądań/godzinę na user_id (lub IP jeśli brak auth)
- **GET endpoints**: 100 żądań/minutę
- **Implementacja**: Middleware lub zewnętrzny serwis (np. Redis + sliding window)
- **Response**: 429 Too Many Requests z header `Retry-After`

### 6.4 Walidacja i sanityzacja danych
- **Zod schemas**: Walidacja wszystkich inputów przed przetwarzaniem
- **Trim strings**: Usuwanie białych znaków
- **Type safety**: TypeScript + runtime validation
- **SQL Injection**: Supabase używa parameterized queries (bezpieczne)

### 6.5 Row Level Security (RLS)
- **Na razie**: Brak autentykacji, user_id może być NULL lub dummy UUID
- **W przyszłości**: RLS policies zapewnią dostęp tylko do własnych danych
- **Przygotowanie kodu**: Wszystkie queries powinny zawierać WHERE user_id = ?

### 6.6 Security Headers
Dodać middleware ustawiający nagłówki dla wszystkich API responses:
```typescript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Type: application/json
```

### 6.7 CORS
- **Ograniczenie origin**: Tylko dozwolone domeny (później)
- **Credentials**: Nie wysyłać credentials w cross-origin requests
- **Methods**: Ograniczyć do potrzebnych metod (GET, POST)

### 6.8 Error Information Disclosure
- **Nie ujawniać szczegółów**: Stack traces, DB schema, internal paths
- **Ogólne komunikaty**: "Internal Server Error" zamiast szczegółów
- **Logging**: Szczegóły logować server-side, nie w response

---

## 7. Obsługa błędów

### 7.1 Format błędu (ApiError)

Wszystkie błędy zwracane w standardowym formacie:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Source text must be at least 1000 characters",
    "details": {
      "field": "source_text",
      "constraint": "min_length",
      "min": 1000,
      "actual": 850
    }
  }
}
```

### 7.2 POST /api/generations - Scenariusze błędów

| Kod | Scenariusz | Message | Details |
|-----|-----------|---------|---------|
| 400 | Nieprawidłowy JSON | "Invalid request body" | - |
| 400 | Brak source_text | "Missing required field: source_text" | { field: "source_text" } |
| 422 | source_text < 1000 | "Source text must be at least 1000 characters" | { field: "source_text", min: 1000, actual: X } |
| 422 | source_text > 10000 | "Source text must not exceed 10000 characters" | { field: "source_text", max: 10000, actual: X } |
| 409 | Duplikat hash | "Generation already exists for this source text" | { existing_generation_id: X } |
| 500 | Błąd LLM API | "Failed to generate flashcards" | - |
| 503 | LLM timeout/unavailable | "AI service temporarily unavailable" | - |
| 500 | Błąd parsowania LLM | "Failed to parse AI response" | - |
| 500 | Błąd DB | "Database error" | - |

**Logowanie błędów do generation_error_logs:**
- Wszystkie błędy związane z LLM API (500, 503)
- Zapisz: user_id, model, source_text_hash, source_text_length, error_code, error_message
- UNIQUE constraint (user_id, source_text_hash) - użyj ON CONFLICT DO UPDATE

### 7.3 GET /api/generations - Scenariusze błędów

| Kod | Scenariusz | Message | Details |
|-----|-----------|---------|---------|
| 400 | page < 1 | "Page must be at least 1" | { field: "page", min: 1, actual: X } |
| 400 | limit < 1 | "Limit must be at least 1" | { field: "limit", min: 1, actual: X } |
| 400 | limit > 50 | "Limit must not exceed 50" | { field: "limit", max: 50, actual: X } |
| 500 | Błąd DB | "Database error" | - |

### 7.4 GET /api/generations/{id} - Scenariusze błędów

| Kod | Scenariusz | Message | Details |
|-----|-----------|---------|---------|
| 400 | ID nie jest liczbą | "Invalid generation ID" | { field: "id" } |
| 400 | ID <= 0 | "Generation ID must be positive" | { field: "id", min: 1 } |
| 404 | Generacja nie istnieje | "Generation not found" | - |
| 500 | Błąd DB | "Database error" | - |

### 7.5 Helper do tworzenia błędów

Stworzyć utility w `src/lib/utils/errors.ts`:

```typescript
export function createApiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: ApiErrorDetail
): Response {
  return new Response(
    JSON.stringify({
      error: { code, message, details }
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    }
  );
}
```

---

## 8. Rozważania dotyczące wydajności

### 8.1 Optymalizacje bazy danych

**Indeksy (już zdefiniowane w migracji):**
- B-Tree `(user_id, created_at DESC)` na tabeli `generations`
  - Przyspiesza sortowanie i paginację
- UNIQUE `(user_id, source_text_hash)` na `generations`
  - Wymusza unikalność i przyspiesza sprawdzanie duplikatów

**Connection Pooling:**
- Supabase automatycznie zarządza poolem połączeń
- Używać jednego klienta Supabase (singleton pattern)

**Query Optimization:**
- GET /api/generations: Użyć COUNT(*) OVER() w głównym query zamiast dwóch zapytań
  ```sql
  SELECT *, COUNT(*) OVER() as total_count
  FROM generations
  WHERE user_id = ?
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
  ```
- GET /api/generations/{id}: LEFT JOIN na flashcards może być kosztowny przy dużej liczbie fiszek
  - Limit do 100 fiszek w response lub paginacja

### 8.2 Caching

**Response caching:**
- GET /api/generations: Cache na 5 minut (może być stale)
- GET /api/generations/{id}: Cache na 10 minut (zmienia się rzadko)
- Implementacja: Redis lub in-memory cache (np. node-cache)
- Cache invalidation: Po utworzeniu nowej generacji lub akceptacji fiszek

**LLM Response caching:**
- OpenRouter.ai może mieć wbudowany cache
- Lokalny cache wyników LLM na podstawie source_text_hash (opcjonalnie)

### 8.3 Rate Limiting dla LLM API

**Problem:**
- Wywołania LLM są kosztowne (czas + koszt $)
- Potencjalne DoS lub przekroczenie budżetu

**Rozwiązanie:**
- Limit 10 requestów/godzinę per user (lub IP)
- Queue dla żądań (jeśli przekroczony limit, dodaj do kolejki)
- Webhook/polling dla long-running generations (przyszłość)

### 8.4 Timeout dla LLM API

**Timeout: 60 sekund**
- Po 60s bez odpowiedzi → 503 Service Unavailable
- Zapisz błąd do generation_error_logs
- Zwróć użytkownikowi informację o retry

### 8.5 Payload Size Limits

**Request body:**
- Max 10000 znaków source_text ≈ 10KB
- Astro domyślnie ogranicza do 100KB

**Response size:**
- Proposed flashcards: Szacunkowo max 50 fiszek × 700 znaków ≈ 35KB
- Akceptowalne dla API response

### 8.6 Async Processing (przyszłość)

Dla bardzo długich generacji:
- WebSocket lub Server-Sent Events dla progress updates
- Background job queue (np. BullMQ + Redis)
- Status endpoint: GET /api/generations/{id}/status

---

## 9. Etapy implementacji

### Faza 1: Przygotowanie struktury (30 min)

1. **Utworzenie struktury katalogów**
   ```
   src/
   ├── pages/
   │   └── api/
   │       └── generations/
   │           ├── index.ts          # GET + POST /api/generations
   │           └── [id].ts           # GET /api/generations/{id}
   ├── lib/
   │   ├── services/
   │   │   ├── generationService.ts
   │   │   ├── llmService.ts
   │   │   ├── hashService.ts
   │   │   └── errorLogService.ts
   │   ├── validation/
   │   │   └── generation.schemas.ts
   │   └── utils/
   │       └── errors.ts
   ```

2. **Dodanie zmiennych środowiskowych**
   - Utworzyć `.env` (jeśli nie istnieje)
   - Dodać `OPENROUTER_API_KEY=your_key_here`
   - Dodać typ w `src/env.d.ts`:
     ```typescript
     interface ImportMetaEnv {
       readonly OPENROUTER_API_KEY: string;
     }
     ```

### Faza 2: Utilities i helpers (45 min)

3. **Implementacja `src/lib/utils/errors.ts`**
   - Funkcja `createApiError(code, message, status, details?)`
   - Helper dla każdego typu błędu (400, 404, 409, 422, 500, 503)

4. **Implementacja `src/lib/utils/hash.ts`**
   - Funkcja `calculateSHA256(text: string): string`
   - Użycie crypto.createHash('sha256') (Node.js)

5. **Implementacja `src/lib/validation/generation.schemas.ts`**
   - `generationCreateSchema` (zod)
   - `generationListQuerySchema` (zod)
   - `generationIdSchema` (zod)
   - `proposedFlashcardSchema` (zod)

### Faza 3: Serwisy (2-3 godziny)

6. **Implementacja `src/lib/services/hashService.ts`**
   ```typescript
   export async function calculateSHA256(text: string): Promise<string>
   ```

7. **Implementacja `src/lib/services/errorLogService.ts`**
   ```typescript
   export async function logGenerationError(
     supabase: SupabaseClient,
     userId: string,
     sourceTextHash: string,
     sourceTextLength: number,
     model: string | null,
     errorCode: string | null,
     errorMessage: string | null
   ): Promise<void>
   ```

8. **Implementacja `src/lib/services/llmService.ts`**
   ```typescript
   export async function generateFlashcards(
     sourceText: string,
     model: string
   ): Promise<{
     flashcards: ProposedFlashcard[];
     duration: number;
   }>
   
   export function parseFlashcardsFromResponse(
     llmResponse: any
   ): ProposedFlashcard[]
   ```
   - Integracja z OpenRouter.ai API
   - System prompt dla generowania fiszek
   - Parsowanie JSON z odpowiedzi
   - Walidacja każdej propozycji
   - Timeout handling (60s)
   - Error handling (try-catch)

9. **Implementacja `src/lib/services/generationService.ts`**
   ```typescript
   export async function checkDuplicateHash(
     supabase: SupabaseClient,
     userId: string,
     hash: string
   ): Promise<number | null>
   
   export async function createGeneration(
     supabase: SupabaseClient,
     userId: string,
     data: Omit<GenerationInsert, 'user_id'>
   ): Promise<GenerationEntity>
   
   export async function listGenerations(
     supabase: SupabaseClient,
     userId: string,
     query: GenerationListQuery
   ): Promise<GenerationListResponse>
   
   export async function getGenerationById(
     supabase: SupabaseClient,
     userId: string,
     id: number
   ): Promise<GenerationDetailDTO | null>
   ```

### Faza 4: API Routes (2-3 godziny)

10. **Implementacja `src/pages/api/generations/index.ts`**
    - Eksport `export const prerender = false;`
    - Handler dla GET:
      ```typescript
      export async function GET({ request, locals }: APIContext)
      ```
      - Parsowanie query params z URL
      - Walidacja przez `generationListQuerySchema`
      - Wywołanie `generationService.listGenerations()`
      - Zwrot 200 lub błędów
    
    - Handler dla POST:
      ```typescript
      export async function POST({ request, locals }: APIContext)
      ```
      - Parsowanie body (await request.json())
      - Walidacja przez `generationCreateSchema`
      - Obliczenie hash (`hashService.calculateSHA256`)
      - Sprawdzenie duplikatów (`generationService.checkDuplicateHash`)
      - Wywołanie LLM (`llmService.generateFlashcards`)
      - Zapis do DB (`generationService.createGeneration`)
      - Zwrot 201 lub błędów
      - W przypadku błędu LLM: logowanie (`errorLogService.logGenerationError`)

11. **Implementacja `src/pages/api/generations/[id].ts`**
    - Eksport `export const prerender = false;`
    - Handler dla GET:
      ```typescript
      export async function GET({ params, locals }: APIContext)
      ```
      - Walidacja params.id przez `generationIdSchema`
      - Wywołanie `generationService.getGenerationById()`
      - Zwrot 200, 404 lub błędów

### Faza 5: Testing i Debugging (1-2 godziny)

12. **Testowanie POST /api/generations**
    - Test z prawidłowym source_text (1000-10000 znaków)
    - Test z zbyt krótkim source_text (< 1000)
    - Test z zbyt długim source_text (> 10000)
    - Test duplikatu (ten sam source_text dwa razy)
    - Test błędu LLM API (mock/invalid API key)
    - Weryfikacja logowania błędów w generation_error_logs

13. **Testowanie GET /api/generations**
    - Test domyślnej paginacji
    - Test custom page i limit
    - Test page < 1
    - Test limit > 50
    - Test pustej listy (brak generacji)

14. **Testowanie GET /api/generations/{id}**
    - Test istniejącej generacji z fiszkami
    - Test istniejącej generacji bez fiszek
    - Test nieistniejącego ID (404)
    - Test nieprawidłowego ID (nie liczba)

### Faza 6: Dokumentacja i Code Review (30 min)

15. **Dokumentacja kodu**
    - JSDoc dla wszystkich publicznych funkcji
    - Komentarze dla skomplikowanej logiki
    - README update (jeśli potrzebne)

16. **Code review checklist**
    - ✅ Wszystkie typy TypeScript poprawne
    - ✅ Walidacja Zod dla wszystkich inputów
    - ✅ Error handling we wszystkich serwisach
    - ✅ Security headers w responses
    - ✅ Logowanie błędów LLM do DB
    - ✅ Brak hardcoded secrets
    - ✅ Zgodność z coding practices (early returns, guard clauses)
    - ✅ ESLint bez błędów

### Faza 7: Optymalizacja (opcjonalna, 1-2 godziny)

17. **Performance improvements**
    - Implementacja connection pooling dla Supabase (jeśli potrzebne)
    - Optymalizacja query dla GET /api/generations (COUNT(*) OVER())
    - Dodanie rate limiting middleware

18. **Caching (opcjonalne)**
    - Setup Redis lub in-memory cache
    - Cache dla GET endpoints

---

## 10. Dodatkowe uwagi

### 10.1 Placeholder dla user_id (na razie brak auth)

Ponieważ autentykacja będzie wdrożona później, należy przygotować kod z placeholderem:

```typescript
// W każdym API route
const userId = locals.user?.id ?? '00000000-0000-0000-0000-000000000000'; // dummy UUID

// LUB wyłączyć RLS policies tymczasowo i używać null
const userId = null;
```

**WAŻNE:** Przed wdrożeniem produkcyjnym włączyć auth i RLS!

### 10.2 Model Selection

W MVP model jest hardcoded (`anthropic/claude-3.5-sonnet`). W przyszłości:
- Dodać pole `model` do `GenerationCreateCommand` (opcjonalne)
- Walidować listę dozwolonych modeli
- Pozwolić użytkownikowi wybierać model

### 10.3 Prompt Engineering

System prompt dla LLM można ulepszyć iteracyjnie:
- Dodać przykłady (few-shot learning)
- Eksperymentować z różnymi instrukcjami
- A/B testing różnych promptów
- Przechowywać prompt w konfiguracji (nie hardcode)

### 10.4 Monitoring

W przyszłości dodać:
- Metryki sukcesu/failure generacji
- Średni czas generowania
- Koszty API (tracking per user)
- Alerting przy wysokim error rate

### 10.5 Graceful Degradation

Jeśli OpenRouter.ai jest niedostępny:
- Zwrócić 503 z informacją o retry
- Opcjonalnie: fallback do innego providera
- Queue system dla offline processing

---

## 11. Checklist przed deployment

- [ ] Wszystkie endpointy zaimplementowane (POST, GET, GET /:id)
- [ ] Walidacja Zod dla wszystkich inputów
- [ ] Error handling zgodny ze specyfikacją
- [ ] Logowanie błędów LLM do generation_error_logs
- [ ] Security headers we wszystkich responses
- [ ] Zmienne środowiskowe skonfigurowane (OPENROUTER_API_KEY)
- [ ] Testy manualne wszystkich scenariuszy
- [ ] ESLint i TypeScript bez błędów
- [ ] Database indexes utworzone (migracja)
- [ ] RLS policies aktywne (gdy auth będzie gotowy)
- [ ] Dokumentacja API aktualna
- [ ] Rate limiting skonfigurowany (opcjonalne)
- [ ] Monitoring setup (opcjonalne)

---

## 12. Następne kroki (po MVP)

1. **Implementacja autentykacji**
   - Integracja z Supabase Auth
   - Middleware dla auth
   - Aktywacja RLS policies
   - Usunięcie dummy user_id

2. **Implementacja flashcards endpoints**
   - POST, GET, PUT, DELETE dla /api/flashcards
   - Integracja z generations (accepted counts)

3. **Rate limiting**
   - Redis + sliding window
   - Middleware dla rate limiting
   - 429 responses

4. **Caching**
   - Redis dla cache
   - Cache invalidation strategy

5. **WebSocket dla real-time progress**
   - Long-running generations
   - Progress updates dla użytkownika

6. **Analytics i monitoring**
   - Sentry dla error tracking
   - Metrics dla business KPIs
   - Cost tracking dla LLM API

---

**Szacowany czas implementacji MVP:** 6-8 godzin

**Dependencies:**
- `zod` (walidacja)
- `@supabase/supabase-js` (już zainstalowane)
- Node.js crypto (wbudowane)
- OpenRouter.ai API key (pozyskać przed implementacją)

