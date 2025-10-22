# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis usługi

Usługa OpenRouter (`OpenRouterService`) stanowi główny interfejs do komunikacji z API OpenRouter.ai w aplikacji 10x-cards. Jej zadaniem jest abstrakcja logiki wywołań API, zarządzanie konfiguracją modeli LLM oraz zapewnienie typowania i walidacji odpowiedzi zgodnie z wymogami aplikacji.

### Główne zadania usługi:

1. **Konfiguracja i autoryzacja** - zarządzanie kluczami API, nagłówkami HTTP i endpointem OpenRouter
2. **Konstrukcja żądań** - budowanie requestów zgodnych ze specyfikacją OpenRouter Chat Completions API
3. **Obsługa odpowiedzi strukturalnych** - wykorzystanie `response_format` do wymuszenia określonego schematu JSON w odpowiedziach modelu
4. **Zarządzanie czasem odpowiedzi** - implementacja timeoutów i abort controllerów
5. **Obsługa błędów** - kategoryzacja i raportowanie błędów (rate limits, timeouty, błędy walidacji)
6. **Walidacja odpowiedzi** - parsowanie i walidacja JSON za pomocą schematów Zod

### Kontekst w architekturze aplikacji:

```
API Endpoint (/api/generations)
    ↓
llmService.generateFlashcards()
    ↓
OpenRouterService.generateCompletion()
    ↓
OpenRouter.ai API
```

---

## 2. Opis konstruktora

Konstruktor klasy `OpenRouterService` inicjalizuje usługę z konfiguracją API oraz domyślnymi parametrami modelu.

### Sygnatura:

```typescript
constructor(config: OpenRouterConfig)
```

### Parametry konfiguracyjne (`OpenRouterConfig`):

```typescript
interface OpenRouterConfig {
  /**
   * Klucz API OpenRouter (wymagany)
   * Powinien być przekazywany z import.meta.env.OPENROUTER_API_KEY
   */
  apiKey: string;

  /**
   * URL endpointu API (opcjonalny)
   * Domyślnie: 'https://openrouter.ai/api/v1/chat/completions'
   */
  apiUrl?: string;

  /**
   * Domyślny model do użycia (opcjonalny)
   * Domyślnie: 'anthropic/claude-3.5-sonnet'
   */
  defaultModel?: string;

  /**
   * Timeout dla żądań w ms (opcjonalny)
   * Domyślnie: 60000 (60 sekund)
   */
  requestTimeout?: number;

  /**
   * HTTP-Referer dla OpenRouter analytics (opcjonalny)
   * Domyślnie: 'https://10xproject.app'
   */
  httpReferer?: string;

  /**
   * X-Title dla OpenRouter analytics (opcjonalny)
   * Domyślnie: '10x Flashcards'
   */
  appTitle?: string;
}
```

### Przykład inicjalizacji:

```typescript
const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: "anthropic/claude-3.5-sonnet",
  requestTimeout: 60000,
  httpReferer: "https://10xproject.app",
  appTitle: "10x Flashcards",
});
```

### Walidacja w konstruktorze:

Konstruktor powinien walidować obecność wymaganego klucza API:

```typescript
constructor(config: OpenRouterConfig) {
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new OpenRouterError(
      'OpenRouter API key is required',
      'CONFIG_ERROR',
      500
    );
  }

  this.apiKey = config.apiKey;
  this.apiUrl = config.apiUrl ?? 'https://openrouter.ai/api/v1/chat/completions';
  this.defaultModel = config.defaultModel ?? 'anthropic/claude-3.5-sonnet';
  this.requestTimeout = config.requestTimeout ?? 60000;
  this.httpReferer = config.httpReferer ?? 'https://10xproject.app';
  this.appTitle = config.appTitle ?? '10x Flashcards';
}
```

---

## 3. Publiczne metody i pola

### 3.1. Główna metoda: `generateCompletion()`

Uniwersalna metoda do generowania odpowiedzi z modelu LLM z obsługą strukturalnych odpowiedzi.

#### Sygnatura:

```typescript
async generateCompletion<T>(
  request: OpenRouterCompletionRequest<T>
): Promise<OpenRouterCompletionResponse<T>>
```

#### Parametry requestu:

```typescript
interface OpenRouterCompletionRequest<T> {
  /**
   * Komunikat systemowy definiujący rolę i instrukcje dla modelu
   */
  systemMessage: string;

  /**
   * Komunikat użytkownika z konkretnymi danymi do przetworzenia
   */
  userMessage: string;

  /**
   * Nazwa modelu do użycia (opcjonalne, domyślnie z konfiguracji)
   */
  model?: string;

  /**
   * Parametry modelu (opcjonalne)
   */
  modelParams?: ModelParameters;

  /**
   * Schemat JSON dla strukturalnej odpowiedzi (opcjonalne)
   * Jeśli podany, odpowiedź będzie walidowana względem tego schematu
   */
  responseSchema?: {
    name: string; // Nazwa schematu (np. 'flashcards_array')
    schema: z.ZodSchema<T>; // Schemat Zod do walidacji
    jsonSchema: object; // JSON Schema do przekazania do API
  };

  /**
   * Metadane dla debugowania i logowania (opcjonalne)
   */
  metadata?: {
    operationName?: string;
    userId?: string;
    [key: string]: any;
  };
}
```

#### Parametry modelu:

```typescript
interface ModelParameters {
  /**
   * Kontrola losowości (0.0 - 2.0)
   * 0.0 = deterministyczne, 2.0 = bardzo kreatywne
   * Domyślnie: 0.7
   */
  temperature?: number;

  /**
   * Maksymalna liczba tokenów do wygenerowania
   * Domyślnie: 2000
   */
  maxTokens?: number;

  /**
   * Top-p sampling (0.0 - 1.0)
   * Domyślnie: 1.0
   */
  topP?: number;

  /**
   * Frequency penalty (-2.0 - 2.0)
   * Zmniejsza powtarzanie tokenów
   * Domyślnie: 0.0
   */
  frequencyPenalty?: number;

  /**
   * Presence penalty (-2.0 - 2.0)
   * Zwiększa różnorodność tematów
   * Domyślnie: 0.0
   */
  presencePenalty?: number;
}
```

#### Odpowiedź:

```typescript
interface OpenRouterCompletionResponse<T> {
  /**
   * Sparsowana i zwalidowana odpowiedź modelu
   */
  data: T;

  /**
   * Czas trwania żądania w milisekundach
   */
  durationMs: number;

  /**
   * Metadane z OpenRouter (opcjonalne)
   */
  metadata?: {
    model: string; // Użyty model
    tokensPrompt?: number; // Liczba tokenów w prompcie
    tokensCompletion?: number; // Liczba tokenów w odpowiedzi
    tokensTotal?: number; // Całkowita liczba tokenów
  };
}
```

#### Przykład użycia (bez response_format):

```typescript
const response = await service.generateCompletion({
  systemMessage: "You are a helpful assistant.",
  userMessage: "Explain TypeScript in one sentence.",
  model: "anthropic/claude-3.5-sonnet",
  modelParams: {
    temperature: 0.5,
    maxTokens: 100,
  },
});

console.log(response.data); // string z odpowiedzią
console.log(response.durationMs); // 2340
```

#### Przykład użycia (z response_format dla fiszek):

```typescript
// 1. Definicja schematu Zod
const flashcardSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
});

const flashcardsArraySchema = z.array(flashcardSchema).min(1);

// 2. Konwersja Zod do JSON Schema
import { zodToJsonSchema } from "zod-to-json-schema";

const jsonSchema = zodToJsonSchema(flashcardsArraySchema, {
  name: "flashcards_array",
  $refStrategy: "none",
});

// 3. Wywołanie API z response_format
const response = await service.generateCompletion({
  systemMessage: `You are an expert at creating educational flashcards.
Generate flashcards from the provided text.

Return your response as a JSON array of flashcards with this structure:
[
  {
    "front": "Question or prompt",
    "back": "Answer or explanation"
  }
]

Constraints:
- "front" must be 1-200 characters
- "back" must be 1-500 characters`,

  userMessage: `Please analyze the following text and generate flashcards:

${sourceText}`,

  model: "anthropic/claude-3.5-sonnet",

  modelParams: {
    temperature: 0.7,
    maxTokens: 2000,
  },

  responseSchema: {
    name: "flashcards_array",
    schema: flashcardsArraySchema,
    jsonSchema: jsonSchema,
  },
});

// Odpowiedź jest już sparsowana i zwalidowana
const flashcards: Array<{ front: string; back: string }> = response.data;
```

### 3.2. Metoda pomocnicza: `testConnection()`

Testuje połączenie z API OpenRouter poprzez prosty request.

#### Sygnatura:

```typescript
async testConnection(): Promise<boolean>
```

#### Przykład użycia:

```typescript
const isConnected = await service.testConnection();
if (!isConnected) {
  console.error("Failed to connect to OpenRouter API");
}
```

---

## 4. Prywatne metody i pola

### 4.1. Pola prywatne:

```typescript
private readonly apiKey: string;
private readonly apiUrl: string;
private readonly defaultModel: string;
private readonly requestTimeout: number;
private readonly httpReferer: string;
private readonly appTitle: string;
```

### 4.2. Metoda: `buildRequestBody()`

Buduje ciało żądania HTTP zgodne z API OpenRouter.

#### Sygnatura:

```typescript
private buildRequestBody<T>(
  request: OpenRouterCompletionRequest<T>
): object
```

#### Implementacja:

```typescript
private buildRequestBody<T>(
  request: OpenRouterCompletionRequest<T>
): object {
  const body: any = {
    model: request.model ?? this.defaultModel,
    messages: [
      {
        role: 'system',
        content: request.systemMessage
      },
      {
        role: 'user',
        content: request.userMessage
      }
    ]
  };

  // Dodaj parametry modelu
  if (request.modelParams) {
    if (request.modelParams.temperature !== undefined) {
      body.temperature = request.modelParams.temperature;
    }
    if (request.modelParams.maxTokens !== undefined) {
      body.max_tokens = request.modelParams.maxTokens;
    }
    if (request.modelParams.topP !== undefined) {
      body.top_p = request.modelParams.topP;
    }
    if (request.modelParams.frequencyPenalty !== undefined) {
      body.frequency_penalty = request.modelParams.frequencyPenalty;
    }
    if (request.modelParams.presencePenalty !== undefined) {
      body.presence_penalty = request.modelParams.presencePenalty;
    }
  }

  // Dodaj response_format jeśli podano schemat
  if (request.responseSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: request.responseSchema.name,
        strict: true,
        schema: request.responseSchema.jsonSchema
      }
    };
  }

  return body;
}
```

#### Przykład wygenerowanego ciała żądania (z response_format):

```json
{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert at creating flashcards..."
    },
    {
      "role": "user",
      "content": "Please analyze the following text..."
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2000,
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "flashcards_array",
      "strict": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "front": {
              "type": "string",
              "minLength": 1,
              "maxLength": 200
            },
            "back": {
              "type": "string",
              "minLength": 1,
              "maxLength": 500
            }
          },
          "required": ["front", "back"],
          "additionalProperties": false
        },
        "minItems": 1
      }
    }
  }
}
```

### 4.3. Metoda: `buildHeaders()`

Buduje nagłówki HTTP dla żądania.

#### Sygnatura:

```typescript
private buildHeaders(): Record<string, string>
```

#### Implementacja:

```typescript
private buildHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.apiKey}`,
    'HTTP-Referer': this.httpReferer,
    'X-Title': this.appTitle
  };
}
```

### 4.4. Metoda: `executeRequest()`

Wykonuje żądanie HTTP z obsługą timeoutu.

#### Sygnatura:

```typescript
private async executeRequest(
  body: object,
  abortSignal: AbortSignal
): Promise<Response>
```

#### Implementacja:

```typescript
private async executeRequest(
  body: object,
  abortSignal: AbortSignal
): Promise<Response> {
  try {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
      signal: abortSignal
    });

    return response;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new OpenRouterError(
        'Request timed out',
        'TIMEOUT',
        503
      );
    }

    throw new OpenRouterError(
      'Network error',
      'NETWORK_ERROR',
      503
    );
  }
}
```

### 4.5. Metoda: `parseAndValidateResponse()`

Parsuje odpowiedź HTTP i waliduje względem schematu (jeśli podano).

#### Sygnatura:

```typescript
private async parseAndValidateResponse<T>(
  response: Response,
  schema?: z.ZodSchema<T>
): Promise<T>
```

#### Implementacja:

```typescript
private async parseAndValidateResponse<T>(
  response: Response,
  schema?: z.ZodSchema<T>
): Promise<T> {
  // Najpierw sprawdź status HTTP
  if (!response.ok) {
    await this.handleHttpError(response);
  }

  // Sparsuj JSON
  const data = await response.json();

  // Wyciągnij treść z odpowiedzi OpenRouter
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new OpenRouterError(
      'Invalid response structure from OpenRouter',
      'INVALID_RESPONSE',
      500
    );
  }

  // Jeśli użyto response_format, treść powinna być już JSON
  let parsedContent: any;

  if (schema) {
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      throw new OpenRouterError(
        'Failed to parse JSON from response',
        'PARSE_ERROR',
        500
      );
    }

    // Waliduj względem schematu Zod
    const validationResult = schema.safeParse(parsedContent);

    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.error.errors);
      throw new OpenRouterError(
        'Response failed schema validation',
        'VALIDATION_ERROR',
        500
      );
    }

    return validationResult.data;
  }

  // Jeśli brak schematu, zwróć surową treść
  return content as T;
}
```

### 4.6. Metoda: `handleHttpError()`

Obsługuje błędy HTTP z OpenRouter API.

#### Sygnatura:

```typescript
private async handleHttpError(response: Response): Promise<never>
```

#### Implementacja:

```typescript
private async handleHttpError(response: Response): Promise<never> {
  let errorData: any = {};

  try {
    errorData = await response.json();
  } catch (e) {
    // Ignoruj błąd parsowania, użyj pustego obiektu
  }

  const errorMessage = errorData.error?.message || 'Unknown error';

  switch (response.status) {
    case 400:
      throw new OpenRouterError(
        `Bad request: ${errorMessage}`,
        'BAD_REQUEST',
        400
      );

    case 401:
      throw new OpenRouterError(
        'Invalid API key',
        'UNAUTHORIZED',
        401
      );

    case 402:
      throw new OpenRouterError(
        'Insufficient credits',
        'INSUFFICIENT_CREDITS',
        402
      );

    case 429:
      throw new OpenRouterError(
        'Rate limit exceeded',
        'RATE_LIMIT',
        429
      );

    case 500:
    case 502:
    case 503:
    case 504:
      throw new OpenRouterError(
        'OpenRouter service unavailable',
        'SERVICE_UNAVAILABLE',
        503
      );

    default:
      throw new OpenRouterError(
        `API error: ${errorMessage}`,
        'API_ERROR',
        response.status
      );
  }
}
```

### 4.7. Metoda: `extractMetadata()`

Wyciąga metadane z odpowiedzi OpenRouter.

#### Sygnatura:

```typescript
private extractMetadata(data: any): OpenRouterCompletionResponse<any>['metadata']
```

#### Implementacja:

```typescript
private extractMetadata(data: any): OpenRouterCompletionResponse<any>['metadata'] {
  return {
    model: data.model,
    tokensPrompt: data.usage?.prompt_tokens,
    tokensCompletion: data.usage?.completion_tokens,
    tokensTotal: data.usage?.total_tokens
  };
}
```

---

## 5. Obsługa błędów

### 5.1. Klasa `OpenRouterError`

Niestandardowa klasa błędu dla wszystkich problemów związanych z OpenRouter.

```typescript
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: OpenRouterErrorCode,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}
```

### 5.2. Kody błędów:

```typescript
type OpenRouterErrorCode =
  | "CONFIG_ERROR" // Błąd konfiguracji (brak klucza API)
  | "TIMEOUT" // Przekroczenie czasu żądania
  | "NETWORK_ERROR" // Błąd połączenia sieciowego
  | "BAD_REQUEST" // Nieprawidłowe żądanie (400)
  | "UNAUTHORIZED" // Nieprawidłowy klucz API (401)
  | "INSUFFICIENT_CREDITS" // Brak kredytów w OpenRouter (402)
  | "RATE_LIMIT" // Przekroczenie limitu (429)
  | "SERVICE_UNAVAILABLE" // Serwis niedostępny (5xx)
  | "INVALID_RESPONSE" // Nieprawidłowa struktura odpowiedzi
  | "PARSE_ERROR" // Błąd parsowania JSON
  | "VALIDATION_ERROR" // Błąd walidacji schematu
  | "API_ERROR"; // Ogólny błąd API
```

### 5.3. Scenariusze błędów:

#### 1. Brak klucza API

```typescript
// W konstruktorze
if (!config.apiKey) {
  throw new OpenRouterError("OpenRouter API key is required", "CONFIG_ERROR", 500);
}
```

#### 2. Timeout żądania

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

try {
  const response = await this.executeRequest(body, controller.signal);
  clearTimeout(timeoutId);
  // ...
} catch (error) {
  if (error instanceof Error && error.name === "AbortError") {
    throw new OpenRouterError("Request timed out", "TIMEOUT", 503);
  }
  throw error;
}
```

#### 3. Błąd walidacji odpowiedzi

```typescript
const validationResult = schema.safeParse(parsedContent);

if (!validationResult.success) {
  console.error("Validation errors:", validationResult.error.errors);

  throw new OpenRouterError("Response failed schema validation", "VALIDATION_ERROR", 500, {
    errors: validationResult.error.errors,
    receivedData: parsedContent,
  });
}
```

#### 4. Błędy HTTP (rate limit, brak kredytów, etc.)

Patrz implementacja `handleHttpError()` w sekcji 4.6.

### 5.4. Logowanie błędów:

Każdy błąd powinien być logowany z odpowiednimi metadanymi:

```typescript
private logError(error: OpenRouterError, context: any): void {
  console.error('[OpenRouterService] Error:', {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    details: error.details,
    context: context
  });
}
```

---

## 6. Kwestie bezpieczeństwa

### 6.1. Ochrona klucza API

**Problem:** Klucz API nie może być eksponowany w przeglądarce.

**Rozwiązanie:** Usługa powinna być używana **tylko po stronie serwera** (API routes, middleware).

```typescript
// ✅ POPRAWNIE - w API route
// src/pages/api/generations.ts
import { OpenRouterService } from "../../lib/services/openRouterService";

export async function POST({ request, locals }) {
  const service = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
  });

  // ... użyj serwisu
}
```

```typescript
// ❌ NIEPOPRAWNIE - w komponencie React
// src/components/MyComponent.tsx
import { OpenRouterService } from "../lib/services/openRouterService";

export function MyComponent() {
  const service = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY, // Klucz wyeksponowany!
  });
  // ...
}
```

### 6.2. Walidacja danych wejściowych

**Problem:** Użytkownik może próbować wysłać zbyt długi tekst lub nieprawidłowe dane.

**Rozwiązanie:** Walidacja przed wysłaniem do OpenRouter.

```typescript
// W endpoint API
const validationResult = generationCreateSchema.safeParse(requestBody);

if (!validationResult.success) {
  return new Response(
    JSON.stringify({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: validationResult.error.errors,
      },
    }),
    { status: 400 }
  );
}
```

### 6.3. Rate limiting

**Problem:** Użytkownik może spamować żądaniami, zużywając kredyty.

**Rozwiązanie:** Implementacja rate limitingu po stronie aplikacji.

```typescript
// Przykładowa implementacja z cache w pamięci
const userRequestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = userRequestCounts.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    userRequestCounts.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}
```

### 6.4. Sanityzacja odpowiedzi

**Problem:** Model może zwrócić niepożądane dane lub złośliwy kod.

**Rozwiązanie:** Ścisła walidacja z Zod i sanityzacja HTML (jeśli wyświetlane w UI).

```typescript
// W schemacie Zod
const flashcardSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .refine((val) => !/<script>/i.test(val), "Flashcard content cannot contain script tags"),
  back: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine((val) => !/<script>/i.test(val), "Flashcard content cannot contain script tags"),
});
```

### 6.5. Obsługa wrażliwych danych

**Problem:** Tekst źródłowy użytkownika może zawierać wrażliwe informacje.

**Rozwiązanie:**

- Nie loguj pełnej zawartości `userMessage` w produkcji
- Rozważ użycie modeli z data privacy (OpenRouter oferuje takie opcje)

```typescript
// W środowisku produkcyjnym
if (import.meta.env.PROD) {
  // Loguj tylko długość, nie zawartość
  console.log(`[OpenRouter] Request sent, message length: ${userMessage.length}`);
} else {
  // W dev można logować więcej
  console.log("[OpenRouter] Request:", { systemMessage, userMessage });
}
```

---

## 7. Plan wdrożenia krok po kroku

### Krok 1: Instalacja zależności

```bash
# Zainstaluj wymagane pakiety
npm install zod-to-json-schema
```

**Cel:** Dodanie biblioteki do konwersji schematów Zod na JSON Schema.

---

### Krok 2: Utworzenie typów TypeScript

**Plik:** `src/lib/services/openRouterService.types.ts`

```typescript
import type { z } from "zod";

/**
 * Konfiguracja usługi OpenRouter
 */
export interface OpenRouterConfig {
  apiKey: string;
  apiUrl?: string;
  defaultModel?: string;
  requestTimeout?: number;
  httpReferer?: string;
  appTitle?: string;
}

/**
 * Parametry modelu LLM
 */
export interface ModelParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Schemat odpowiedzi dla strukturalnych odpowiedzi
 */
export interface ResponseSchema<T> {
  name: string;
  schema: z.ZodSchema<T>;
  jsonSchema: object;
}

/**
 * Żądanie completion do OpenRouter
 */
export interface OpenRouterCompletionRequest<T = string> {
  systemMessage: string;
  userMessage: string;
  model?: string;
  modelParams?: ModelParameters;
  responseSchema?: ResponseSchema<T>;
  metadata?: {
    operationName?: string;
    userId?: string;
    [key: string]: any;
  };
}

/**
 * Odpowiedź z OpenRouter
 */
export interface OpenRouterCompletionResponse<T> {
  data: T;
  durationMs: number;
  metadata?: {
    model: string;
    tokensPrompt?: number;
    tokensCompletion?: number;
    tokensTotal?: number;
  };
}

/**
 * Kody błędów OpenRouter
 */
export type OpenRouterErrorCode =
  | "CONFIG_ERROR"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "INSUFFICIENT_CREDITS"
  | "RATE_LIMIT"
  | "SERVICE_UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "PARSE_ERROR"
  | "VALIDATION_ERROR"
  | "API_ERROR";
```

---

### Krok 3: Utworzenie klasy błędu

**Plik:** `src/lib/services/openRouterService.errors.ts`

```typescript
import type { OpenRouterErrorCode } from "./openRouterService.types";

/**
 * Niestandardowa klasa błędu dla OpenRouter
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: OpenRouterErrorCode,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "OpenRouterError";
  }

  /**
   * Sprawdza czy błąd jest możliwy do ponowienia
   */
  isRetryable(): boolean {
    return ["TIMEOUT", "NETWORK_ERROR", "SERVICE_UNAVAILABLE"].includes(this.code);
  }

  /**
   * Konwertuje błąd do formatu API response
   */
  toApiError() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}
```

---

### Krok 4: Implementacja głównej klasy serwisu

**Plik:** `src/lib/services/openRouterService.ts`

```typescript
import type {
  OpenRouterConfig,
  OpenRouterCompletionRequest,
  OpenRouterCompletionResponse,
  ModelParameters,
} from "./openRouterService.types";
import { OpenRouterError } from "./openRouterService.errors";

/**
 * Usługa do komunikacji z OpenRouter.ai API
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly defaultModel: string;
  private readonly requestTimeout: number;
  private readonly httpReferer: string;
  private readonly appTitle: string;

  constructor(config: OpenRouterConfig) {
    // Walidacja konfiguracji
    if (!config.apiKey || config.apiKey.trim() === "") {
      throw new OpenRouterError("OpenRouter API key is required", "CONFIG_ERROR", 500);
    }

    // Inicjalizacja pól
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl ?? "https://openrouter.ai/api/v1/chat/completions";
    this.defaultModel = config.defaultModel ?? "anthropic/claude-3.5-sonnet";
    this.requestTimeout = config.requestTimeout ?? 60000;
    this.httpReferer = config.httpReferer ?? "https://10xproject.app";
    this.appTitle = config.appTitle ?? "10x Flashcards";
  }

  /**
   * Generuje completion z OpenRouter API
   */
  async generateCompletion<T = string>(
    request: OpenRouterCompletionRequest<T>
  ): Promise<OpenRouterCompletionResponse<T>> {
    const startTime = Date.now();

    // Zbuduj ciało żądania
    const body = this.buildRequestBody(request);

    // Utwórz abort controller dla timeoutu
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      // Wykonaj żądanie HTTP
      const response = await this.executeRequest(body, controller.signal);
      clearTimeout(timeoutId);

      // Sparsuj odpowiedź JSON
      const responseData = await response.json();

      // Wyciągnij i waliduj dane
      const data = await this.parseAndValidateResponse<T>(responseData, request.responseSchema?.schema);

      // Oblicz czas trwania
      const durationMs = Date.now() - startTime;

      // Wyciągnij metadane
      const metadata = this.extractMetadata(responseData);

      return {
        data,
        durationMs,
        metadata,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Obsłuż timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterError("Request timed out", "TIMEOUT", 503);
      }

      // Przepuść OpenRouterError
      if (error instanceof OpenRouterError) {
        throw error;
      }

      // Obsłuż błędy sieciowe
      throw new OpenRouterError("Network error occurred", "NETWORK_ERROR", 503);
    }
  }

  /**
   * Testuje połączenie z API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.generateCompletion({
        systemMessage: "You are a helpful assistant.",
        userMessage: 'Say "OK"',
        modelParams: {
          maxTokens: 10,
        },
      });
      return true;
    } catch (error) {
      console.error("[OpenRouterService] Connection test failed:", error);
      return false;
    }
  }

  /**
   * Buduje ciało żądania HTTP
   */
  private buildRequestBody<T>(request: OpenRouterCompletionRequest<T>): object {
    const body: any = {
      model: request.model ?? this.defaultModel,
      messages: [
        {
          role: "system",
          content: request.systemMessage,
        },
        {
          role: "user",
          content: request.userMessage,
        },
      ],
    };

    // Dodaj parametry modelu
    if (request.modelParams) {
      this.applyModelParameters(body, request.modelParams);
    }

    // Dodaj response_format jeśli podano schemat
    if (request.responseSchema) {
      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: request.responseSchema.name,
          strict: true,
          schema: request.responseSchema.jsonSchema,
        },
      };
    }

    return body;
  }

  /**
   * Aplikuje parametry modelu do ciała żądania
   */
  private applyModelParameters(body: any, params: ModelParameters): void {
    if (params.temperature !== undefined) {
      body.temperature = params.temperature;
    }
    if (params.maxTokens !== undefined) {
      body.max_tokens = params.maxTokens;
    }
    if (params.topP !== undefined) {
      body.top_p = params.topP;
    }
    if (params.frequencyPenalty !== undefined) {
      body.frequency_penalty = params.frequencyPenalty;
    }
    if (params.presencePenalty !== undefined) {
      body.presence_penalty = params.presencePenalty;
    }
  }

  /**
   * Buduje nagłówki HTTP
   */
  private buildHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "HTTP-Referer": this.httpReferer,
      "X-Title": this.appTitle,
    };
  }

  /**
   * Wykonuje żądanie HTTP
   */
  private async executeRequest(body: object, abortSignal: AbortSignal): Promise<Response> {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
        signal: abortSignal,
      });

      // Obsłuż błędy HTTP
      if (!response.ok) {
        await this.handleHttpError(response);
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterError("Request timed out", "TIMEOUT", 503);
      }

      if (error instanceof OpenRouterError) {
        throw error;
      }

      throw new OpenRouterError("Network error", "NETWORK_ERROR", 503);
    }
  }

  /**
   * Parsuje i waliduje odpowiedź
   */
  private async parseAndValidateResponse<T>(responseData: any, schema?: any): Promise<T> {
    // Wyciągnij treść z odpowiedzi OpenRouter
    const content = responseData.choices?.[0]?.message?.content;

    if (!content) {
      throw new OpenRouterError("Invalid response structure from OpenRouter", "INVALID_RESPONSE", 500);
    }

    // Jeśli brak schematu, zwróć surową treść
    if (!schema) {
      return content as T;
    }

    // Parsuj JSON
    let parsedContent: any;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      throw new OpenRouterError("Failed to parse JSON from response", "PARSE_ERROR", 500, { rawContent: content });
    }

    // Waliduj względem schematu Zod
    const validationResult = schema.safeParse(parsedContent);

    if (!validationResult.success) {
      console.error("[OpenRouterService] Validation errors:", validationResult.error.errors);
      throw new OpenRouterError("Response failed schema validation", "VALIDATION_ERROR", 500, {
        errors: validationResult.error.errors,
        receivedData: parsedContent,
      });
    }

    return validationResult.data;
  }

  /**
   * Obsługuje błędy HTTP
   */
  private async handleHttpError(response: Response): Promise<never> {
    let errorData: any = {};

    try {
      errorData = await response.json();
    } catch (e) {
      // Ignoruj błąd parsowania
    }

    const errorMessage = errorData.error?.message || "Unknown error";

    switch (response.status) {
      case 400:
        throw new OpenRouterError(`Bad request: ${errorMessage}`, "BAD_REQUEST", 400, errorData);

      case 401:
        throw new OpenRouterError("Invalid API key", "UNAUTHORIZED", 401);

      case 402:
        throw new OpenRouterError("Insufficient credits in OpenRouter account", "INSUFFICIENT_CREDITS", 402);

      case 429:
        throw new OpenRouterError("Rate limit exceeded", "RATE_LIMIT", 429, {
          retryAfter: response.headers.get("Retry-After"),
        });

      case 500:
      case 502:
      case 503:
      case 504:
        throw new OpenRouterError("OpenRouter service temporarily unavailable", "SERVICE_UNAVAILABLE", 503);

      default:
        throw new OpenRouterError(`API error: ${errorMessage}`, "API_ERROR", response.status, errorData);
    }
  }

  /**
   * Wyciąga metadane z odpowiedzi
   */
  private extractMetadata(data: any): OpenRouterCompletionResponse<any>["metadata"] {
    return {
      model: data.model,
      tokensPrompt: data.usage?.prompt_tokens,
      tokensCompletion: data.usage?.completion_tokens,
      tokensTotal: data.usage?.total_tokens,
    };
  }
}
```

---

### Krok 5: Aktualizacja `llmService.ts`

**Plik:** `src/lib/services/llmService.ts`

Zastąp zawartość pliku nową implementacją używającą `OpenRouterService`:

```typescript
/**
 * LLM service for AI-powered flashcard generation
 * Integrates with OpenRouter.ai API via OpenRouterService
 */

import type { ProposedFlashcard } from "../../types";
import { proposedFlashcardsArraySchema } from "../validation/generation.schemas";
import { OpenRouterService } from "./openRouterService";
import { OpenRouterError } from "./openRouterService.errors";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Default configuration
 */
const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";
const REQUEST_TIMEOUT = 60000; // 60 seconds

/**
 * System prompt for flashcard generation
 */
const SYSTEM_PROMPT = `You are an expert at creating educational flashcards. Your task is to analyze the provided source text and generate high-quality flashcards that help users learn and retain the key information.

Guidelines for creating flashcards:
1. Extract the most important concepts, facts, and relationships from the text
2. Create clear, concise questions (front) and accurate answers (back)
3. Each flashcard should focus on a single concept or fact
4. Questions should be specific and unambiguous
5. Answers should be comprehensive but concise
6. Use simple, clear language
7. Avoid redundancy between flashcards
8. Aim for 5-15 flashcards depending on the source text complexity

Return your response as a JSON array of flashcards with the following structure:
[
  {
    "front": "Question or prompt",
    "back": "Answer or explanation"
  }
]

Important constraints:
- "front" must be 1-200 characters
- "back" must be 1-500 characters`;

/**
 * User prompt template
 */
const createUserPrompt = (sourceText: string): string => {
  return `Please analyze the following text and generate flashcards:\n\n${sourceText}`;
};

/**
 * Custom error class for LLM service errors
 * Wraps OpenRouterError for backward compatibility
 */
export class LLMServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "LLMServiceError";
  }
}

/**
 * Converts OpenRouterError to LLMServiceError
 */
function convertError(error: OpenRouterError): LLMServiceError {
  return new LLMServiceError(error.message, error.code, error.statusCode);
}

/**
 * Generates flashcards from source text using OpenRouter.ai API
 */
export async function generateFlashcards(
  sourceText: string,
  model: string = DEFAULT_MODEL
): Promise<{
  flashcards: ProposedFlashcard[];
  duration: number;
}> {
  // Initialize OpenRouter service
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new LLMServiceError("OpenRouter API key not configured", "CONFIG_ERROR", 500);
  }

  const service = new OpenRouterService({
    apiKey,
    defaultModel: model,
    requestTimeout: REQUEST_TIMEOUT,
  });

  // Prepare response schema
  const jsonSchema = zodToJsonSchema(proposedFlashcardsArraySchema, {
    name: "flashcards_array",
    $refStrategy: "none",
  });

  try {
    // Call OpenRouter API
    const response = await service.generateCompletion({
      systemMessage: SYSTEM_PROMPT,
      userMessage: createUserPrompt(sourceText),
      model,
      modelParams: {
        temperature: 0.7,
        maxTokens: 2000,
      },
      responseSchema: {
        name: "flashcards_array",
        schema: proposedFlashcardsArraySchema,
        jsonSchema: jsonSchema,
      },
    });

    // Transform to ProposedFlashcard format
    const flashcards: ProposedFlashcard[] = response.data.map((fc: any) => ({
      front: fc.front,
      back: fc.back,
      source: "ai-full" as const,
    }));

    if (flashcards.length === 0) {
      throw new LLMServiceError("No flashcards generated", "VALIDATION_ERROR", 500);
    }

    return {
      flashcards,
      duration: response.durationMs,
    };
  } catch (error) {
    if (error instanceof OpenRouterError) {
      throw convertError(error);
    }

    if (error instanceof LLMServiceError) {
      throw error;
    }

    throw new LLMServiceError("Unexpected error during flashcard generation", "INTERNAL_ERROR", 500);
  }
}
```

---

### Krok 6: Eksport usługi

**Plik:** `src/lib/services/index.ts` (utwórz jeśli nie istnieje)

```typescript
// Eksport wszystkich serwisów
export { OpenRouterService } from "./openRouterService";
export { OpenRouterError } from "./openRouterService.errors";
export type {
  OpenRouterConfig,
  OpenRouterCompletionRequest,
  OpenRouterCompletionResponse,
  ModelParameters,
  ResponseSchema,
  OpenRouterErrorCode,
} from "./openRouterService.types";

export { generateFlashcards, LLMServiceError } from "./llmService";
export * from "./flashcardService";
export * from "./generationService";
export * from "./hashService";
export * from "./errorLogService";
```

---

### Krok 7: Testowanie implementacji

**Plik:** `src/lib/services/__tests__/openRouterService.test.ts` (opcjonalnie)

Jeśli projekt używa testów:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenRouterService } from "../openRouterService";
import { OpenRouterError } from "../openRouterService.errors";

describe("OpenRouterService", () => {
  let service: OpenRouterService;

  beforeEach(() => {
    service = new OpenRouterService({
      apiKey: "test-api-key",
      defaultModel: "test-model",
    });
  });

  it("should throw error when API key is missing", () => {
    expect(() => {
      new OpenRouterService({ apiKey: "" });
    }).toThrow(OpenRouterError);
  });

  it("should build request body correctly", () => {
    // Test prywatnej metody przez publiczną
    // ...
  });

  // Więcej testów...
});
```

---

### Krok 8: Aktualizacja dokumentacji

**Plik:** `README.md`

Dodaj sekcję o OpenRouter:

````markdown
## OpenRouter Integration

This project uses OpenRouter.ai as the LLM provider. OpenRouter provides access to multiple AI models through a single API.

### Configuration

Set the `OPENROUTER_API_KEY` environment variable in your `.env` file:

```env
OPENROUTER_API_KEY=your-openrouter-api-key
```
````

### Supported Models

- `anthropic/claude-3.5-sonnet` (default)
- `openai/gpt-4-turbo`
- Other models available through OpenRouter

### Usage

The `OpenRouterService` is used internally by `llmService.generateFlashcards()`. You can also use it directly for other LLM tasks:

```typescript
import { OpenRouterService } from "./lib/services/openRouterService";

const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
});

const response = await service.generateCompletion({
  systemMessage: "You are a helpful assistant.",
  userMessage: "Explain TypeScript.",
  modelParams: {
    temperature: 0.5,
  },
});
```

For structured responses, use the `responseSchema` parameter with a Zod schema.

````

---

### Krok 9: Walidacja i testowanie

1. **Sprawdź kompilację TypeScript:**

```bash
npm run build
````

2. **Uruchom serwer deweloperski:**

```bash
npm run dev
```

3. **Przetestuj generowanie fiszek:**

Przejdź do `/generate`, wprowadź tekst źródłowy i wygeneruj fiszki.

4. **Sprawdź logi w konsoli:**

Sprawdź, czy żądania do OpenRouter są wysyłane poprawnie.

5. **Przetestuj obsługę błędów:**

- Usuń klucz API i sprawdź, czy błąd jest poprawnie obsługiwany
- Wprowadź zbyt długi tekst i sprawdź walidację
- Symuluj brak połączenia sieciowego

---

### Krok 10: Optymalizacja i monitoring

1. **Dodaj metryki:**

```typescript
// W OpenRouterService
private metrics = {
  totalRequests: 0,
  totalErrors: 0,
  totalTokens: 0,
  averageDuration: 0
};

private updateMetrics(response: OpenRouterCompletionResponse<any>): void {
  this.metrics.totalRequests++;
  this.metrics.totalTokens += response.metadata?.tokensTotal ?? 0;
  this.metrics.averageDuration =
    (this.metrics.averageDuration * (this.metrics.totalRequests - 1) + response.durationMs) /
    this.metrics.totalRequests;
}

getMetrics() {
  return { ...this.metrics };
}
```

2. **Dodaj retry logic dla błędów możliwych do ponowienia:**

```typescript
async generateCompletionWithRetry<T>(
  request: OpenRouterCompletionRequest<T>,
  maxRetries: number = 3
): Promise<OpenRouterCompletionResponse<T>> {
  let lastError: OpenRouterError | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.generateCompletion(request);
    } catch (error) {
      if (error instanceof OpenRouterError && error.isRetryable()) {
        lastError = error;
        console.log(`[OpenRouterService] Retry attempt ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw error;
    }
  }

  throw lastError!;
}
```

3. **Dodaj cache dla identycznych żądań (opcjonalnie):**

```typescript
private responseCache = new Map<string, { data: any; timestamp: number }>();
private cacheTTL = 300000; // 5 minut

private getCacheKey(request: OpenRouterCompletionRequest<any>): string {
  return JSON.stringify({
    system: request.systemMessage,
    user: request.userMessage,
    model: request.model
  });
}
```

---

## Podsumowanie

Ten przewodnik implementacji dostarcza kompleksowy plan wdrożenia usługi OpenRouter dla aplikacji 10x-cards. Usługa została zaprojektowana z uwzględnieniem:

✅ **Typowania TypeScript** - pełne wsparcie dla IntelliSense i type checking  
✅ **Bezpieczeństwa** - klucz API tylko po stronie serwera, walidacja danych  
✅ **Obsługi błędów** - szczegółowa kategoryzacja i logowanie błędów  
✅ **Strukturalnych odpowiedzi** - wykorzystanie `response_format` z JSON Schema  
✅ **Walidacji** - użycie Zod do walidacji odpowiedzi  
✅ **Testowalności** - separacja logiki, dependency injection  
✅ **Maintainability** - czysty kod zgodny z zasadami projektu

Implementacja jest gotowa do użycia w środowisku produkcyjnym i może być łatwo rozszerzona o dodatkowe funkcjonalności, takie jak:

- Streaming responses
- Multi-turn conversations
- Function calling
- Vision models (obrazy)
- Embedding models

Powodzenia w implementacji! 🚀
