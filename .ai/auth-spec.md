# Specyfikacja Techniczna: Moduł Autentykacji i Autoryzacji
## Dokument architektoniczny dla systemu logowania użytkowników w aplikacji 10x-cards

---

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1 Struktura Stron i Routingu

#### 1.1.1 Nowe Strony Astro (Public Routes)

**`/login` - Strona Logowania**
- **Plik:** `src/pages/login.astro`
- **Layout:** `MinimalLayout.astro` (bez nagłówka dashboardu)
- **Główny komponent:** `LoginForm` (React, client:load)
- **Funkcjonalność:**
  - Formularz logowania z email i hasłem
  - Link do strony rejestracji
  - Link do odzyskiwania hasła
  - Wyświetlanie błędów walidacji i autoryzacji
  - Przekierowanie do `/dashboard` po udanym logowaniu
- **Middleware:** Jeśli użytkownik już zalogowany → redirect do `/dashboard`

**`/register` - Strona Rejestracji**
- **Plik:** `src/pages/register.astro`
- **Layout:** `MinimalLayout.astro`
- **Główny komponent:** `RegisterForm` (React, client:load)
- **Funkcjonalność:**
  - Formularz rejestracji (email, hasło, potwierdzenie hasła)
  - Link do strony logowania
  - Walidacja siły hasła (min. 8 znaków, min. 1 wielka litera, min. 1 cyfra)
  - Potwierdzenie emaila przez Supabase
  - Komunikat o konieczności weryfikacji emaila
- **Middleware:** Jeśli użytkownik już zalogowany → redirect do `/dashboard`

**`/forgot-password` - Strona Odzyskiwania Hasła**
- **Plik:** `src/pages/forgot-password.astro`
- **Layout:** `MinimalLayout.astro`
- **Główny komponent:** `ForgotPasswordForm` (React, client:load)
- **Funkcjonalność:**
  - Formularz z polem email
  - Wysyłanie linku resetującego przez Supabase Auth
  - Komunikat potwierdzający wysłanie emaila
  - Link powrotny do logowania
- **Middleware:** Dostępne dla niezalogowanych użytkowników

**`/reset-password` - Strona Resetowania Hasła**
- **Plik:** `src/pages/reset-password.astro`
- **Layout:** `MinimalLayout.astro`
- **Główny komponent:** `ResetPasswordForm` (React, client:load)
- **Funkcjonalność:**
  - Formularz z nowym hasłem i potwierdzeniem
  - Walidacja tokenu z URL (query params)
  - Walidacja siły hasła
  - Ustawienie nowego hasła przez Supabase Auth
  - Przekierowanie do `/login` po sukcesie
- **Middleware:** Token musi być validny (sprawdzane po stronie Supabase)

**`/settings` - Strona Ustawień Konta**
- **Plik:** `src/pages/settings.astro`
- **Layout:** `Layout.astro` (z pełnym headerem)
- **Główny komponent:** `SettingsView` (React, client:load)
- **Funkcjonalność:**
  - Sekcja zmiany hasła (`ChangePasswordForm`)
  - Sekcja usuwania konta (`DeleteAccountSection`)
  - Wyświetlanie informacji o koncie (email, data rejestracji)
- **Middleware:** Chroniona strona - wymaga autoryzacji

#### 1.1.2 Aktualizacja Istniejących Stron

**`/` (Index) - Strona Powitalna**
- **Zmiana:** Dodanie przycisków CTA
- **Nowe elementy:**
  - Przycisk "Zaloguj się" → `/login`
  - Przycisk "Zarejestruj się" → `/register`
  - Jeśli użytkownik zalogowany → automatyczne przekierowanie do `/dashboard`

**`/dashboard` - Panel Główny**
- **Zmiana:** Brak zmian strukturalnych
- **Walidacja:** Middleware wymusza autoryzację
- **Props:** `Astro.locals.user` zawsze wypełniony (po włączeniu auth)

**Wszystkie Protected Routes**
- `/flashcards`, `/generate`, `/study`, `/generations`, `/generations/[id]`
- **Zmiana:** Middleware wymusza autoryzację
- **Przekierowanie:** Niezalogowany użytkownik → `/login` z query param `?redirect={current_path}`

### 1.2 Komponenty React (Client-Side)

#### 1.2.1 Komponenty Formularzy Autoryzacji

**`LoginForm.tsx`**
- **Lokalizacja:** `src/components/auth/LoginForm.tsx`
- **Technologia:** React + shadcn/ui (Input, Button, Label)
- **State Management:**
  - `email: string` - pole email
  - `password: string` - pole hasło
  - `isLoading: boolean` - status ładowania
  - `error: string | null` - komunikat błędu
- **Walidacja (client-side):**
  - Email: format emaila (regex)
  - Password: niepuste
- **Akcje:**
  - `handleSubmit()` - wywołuje `/api/auth/login` (POST)
  - W przypadku sukcesu: redirect do `/dashboard` lub query param `redirect`
  - W przypadku błędu: wyświetlenie komunikatu
- **UI/UX:**
  - Toast notifications (sukces/błąd)
  - Disabled state podczas ładowania
  - Focus management (automatyczny focus na email)
  - Keyboard navigation (Enter submits form)

**`RegisterForm.tsx`**
- **Lokalizacja:** `src/components/auth/RegisterForm.tsx`
- **Technologia:** React + shadcn/ui
- **State Management:**
  - `email: string`
  - `password: string`
  - `confirmPassword: string`
  - `isLoading: boolean`
  - `error: string | null`
- **Walidacja (client-side):**
  - Email: format emaila
  - Password: min. 8 znaków, min. 1 wielka litera, min. 1 cyfra
  - Confirm Password: zgodność z password
- **Wskaźnik Siły Hasła:**
  - Komponent `PasswordStrengthIndicator` (weak/medium/strong)
  - Kolor: czerwony/żółty/zielony
- **Akcje:**
  - `handleSubmit()` - wywołuje `/api/auth/register` (POST)
  - Sukces: komunikat o wysłaniu emaila weryfikacyjnego
  - Błąd: wyświetlenie komunikatu
- **UI/UX:**
  - Real-time walidacja podczas wpisywania
  - Toast notifications
  - Ikona "show/hide password"

**`ForgotPasswordForm.tsx`**
- **Lokalizacja:** `src/components/auth/ForgotPasswordForm.tsx`
- **State Management:**
  - `email: string`
  - `isLoading: boolean`
  - `isSubmitted: boolean` - czy email został wysłany
  - `error: string | null`
- **Walidacja:**
  - Email: format emaila
- **Akcje:**
  - `handleSubmit()` - wywołuje `/api/auth/forgot-password` (POST)
  - Po sukcesie: zmiana widoku na komunikat potwierdzający
- **UI/UX:**
  - Dwustanowy widok: formularz → komunikat sukcesu
  - Możliwość ponownego wysłania po 60 sekundach

**`ResetPasswordForm.tsx`**
- **Lokalizacja:** `src/components/auth/ResetPasswordForm.tsx`
- **State Management:**
  - `password: string`
  - `confirmPassword: string`
  - `isLoading: boolean`
  - `error: string | null`
- **Walidacja:**
  - Password: min. 8 znaków, min. 1 wielka litera, min. 1 cyfra
  - Confirm Password: zgodność
- **Token:**
  - Pobierany z URL query params (Supabase przekazuje w linku)
- **Akcje:**
  - `handleSubmit()` - wywołuje `/api/auth/reset-password` (POST)
  - Sukces: redirect do `/login` z komunikatem
  - Błąd (np. wygasły token): komunikat z możliwością ponownej prośby

**`ChangePasswordForm.tsx`**
- **Lokalizacja:** `src/components/settings/ChangePasswordForm.tsx`
- **State Management:**
  - `currentPassword: string`
  - `newPassword: string`
  - `confirmNewPassword: string`
  - `isLoading: boolean`
  - `error: string | null`
- **Walidacja:**
  - Current Password: niepuste
  - New Password: min. 8 znaków, min. 1 wielka litera, min. 1 cyfra
  - Confirm: zgodność z new password
- **Akcje:**
  - `handleSubmit()` - wywołuje `/api/auth/change-password` (POST)
  - Wymaga podania obecnego hasła dla bezpieczeństwa

**`DeleteAccountSection.tsx`**
- **Lokalizacja:** `src/components/settings/DeleteAccountSection.tsx`
- **State Management:**
  - `confirmationText: string` - użytkownik wpisuje "DELETE"
  - `isDialogOpen: boolean`
  - `isDeleting: boolean`
- **Akcje:**
  - `handleDelete()` - wywołuje `/api/auth/delete-account` (DELETE)
  - Wymaga potwierdzenia przez wpisanie "DELETE"
  - Po sukcesie: wylogowanie i redirect do `/`
- **UI/UX:**
  - Alert Dialog (shadcn/ui)
  - Czerwony przycisk akcji (destructive variant)
  - Ostrzeżenie o nieodwracalności operacji

#### 1.2.2 Aktualizacja Istniejących Komponentów

**`DashboardHeader.tsx`**
- **Zmiana:** Implementacja funkcji `onLogout`
- **Nowa logika:**
  ```typescript
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { 
        method: 'POST' 
      });
      
      if (response.ok) {
        window.location.href = '/login';
      } else {
        // Toast error
      }
    } catch (error) {
      // Toast error
    }
  };
  ```
- **Dodatkowe menu items:**
  - "Ustawienia konta" → `/settings`
  - "Wyloguj się" (już istnieje)

**`DashboardContent.tsx`**
- **Zmiana:** Przekazywanie `handleLogout` do `DashboardHeader`
- Brak innych zmian

**`MenuGrid.tsx` / `MenuTile.tsx`**
- **Zmiana:** Dodanie nowego kafelka "Ustawienia" (opcjonalnie)
- Ikona: Settings/Cog
- Link: `/settings`

### 1.3 Walidacja i Komunikaty Błędów

#### 1.3.1 Walidacja Client-Side (React)

**Reguły Walidacji Email:**
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = emailRegex.test(email);
```

**Reguły Walidacji Hasła:**
```typescript
const passwordRules = {
  minLength: 8,
  requireUppercase: /[A-Z]/,
  requireNumber: /[0-9]/,
};

const validatePassword = (password: string) => {
  if (password.length < passwordRules.minLength) {
    return 'Hasło musi mieć minimum 8 znaków';
  }
  if (!passwordRules.requireUppercase.test(password)) {
    return 'Hasło musi zawierać przynajmniej jedną wielką literę';
  }
  if (!passwordRules.requireNumber.test(password)) {
    return 'Hasło musi zawierać przynajmniej jedną cyfrę';
  }
  return null;
};
```

**Walidacja Zgodności Haseł:**
```typescript
if (password !== confirmPassword) {
  return 'Hasła nie są identyczne';
}
```

#### 1.3.2 Komunikaty Błędów API

**Login Errors:**
- `INVALID_CREDENTIALS` → "Nieprawidłowy email lub hasło"
- `EMAIL_NOT_CONFIRMED` → "Potwierdź swój adres email przed zalogowaniem"
- `ACCOUNT_LOCKED` → "Konto zostało zablokowane. Skontaktuj się z pomocą techniczną"

**Register Errors:**
- `EMAIL_ALREADY_EXISTS` → "Użytkownik z tym adresem email już istnieje"
- `WEAK_PASSWORD` → "Hasło jest zbyt słabe. Spełnij wszystkie wymagania"
- `INVALID_EMAIL` → "Nieprawidłowy format adresu email"

**General Errors:**
- `RATE_LIMIT_EXCEEDED` → "Zbyt wiele prób. Spróbuj ponownie za {time} sekund"
- `SERVICE_UNAVAILABLE` → "Serwis tymczasowo niedostępny. Spróbuj ponownie później"
- `INTERNAL_SERVER_ERROR` → "Wystąpił błąd serwera. Spróbuj ponownie"

#### 1.3.3 Toast Notifications

**Implementacja:**
- Wykorzystanie istniejącego `ToasterProvider` (shadcn/ui sonner)
- Typy: success, error, info

**Przykłady:**
```typescript
import { toast } from 'sonner';

// Sukces
toast.success('Zalogowano pomyślnie!');

// Błąd
toast.error('Nie udało się zalogować', {
  description: 'Sprawdź swoje dane logowania'
});

// Info
toast.info('Link resetujący został wysłany na Twój email');
```

### 1.4 Obsługa Najważniejszych Scenariuszy

#### Scenariusz 1: Nowy Użytkownik Rejestruje Się
1. Użytkownik wchodzi na `/register`
2. Wypełnia formularz (email, hasło, potwierdzenie)
3. Walidacja client-side w czasie rzeczywistym
4. Submit → POST `/api/auth/register`
5. Supabase wysyła email weryfikacyjny
6. Komunikat: "Sprawdź swoją skrzynkę email i potwierdź adres"
7. Użytkownik klika link w emailu → Supabase potwierdza
8. Przekierowanie do `/login` z komunikatem sukcesu

#### Scenariusz 2: Użytkownik Loguje Się
1. Użytkownik wchodzi na `/login`
2. Wypełnia email i hasło
3. Submit → POST `/api/auth/login`
4. Supabase Auth weryfikuje credentials
5. W przypadku sukcesu:
   - Sesja JWT zapisana w cookies
   - Redirect do `/dashboard` (lub query param `redirect`)
6. W przypadku błędu:
   - Toast z komunikatem błędu

#### Scenariusz 3: Użytkownik Zapomniał Hasła
1. Użytkownik wchodzi na `/forgot-password`
2. Wpisuje email
3. Submit → POST `/api/auth/forgot-password`
4. Supabase wysyła email z linkiem
5. Komunikat: "Link resetujący został wysłany"
6. Użytkownik klika link → przekierowanie do `/reset-password?token=...`
7. Wpisuje nowe hasło
8. Submit → POST `/api/auth/reset-password`
9. Przekierowanie do `/login` z komunikatem sukcesu

#### Scenariusz 4: Użytkownik Chce Zmienić Hasło
1. Zalogowany użytkownik wchodzi na `/settings`
2. Sekcja "Zmiana hasła"
3. Wpisuje obecne hasło, nowe hasło, potwierdzenie
4. Submit → POST `/api/auth/change-password`
5. Supabase weryfikuje obecne hasło i ustawia nowe
6. Toast sukcesu

#### Scenariusz 5: Użytkownik Chce Usunąć Konto
1. Zalogowany użytkownik wchodzi na `/settings`
2. Sekcja "Usuwanie konta"
3. Kliknięcie "Usuń konto" → Alert Dialog
4. Potwierdzenie przez wpisanie "DELETE"
5. Submit → DELETE `/api/auth/delete-account`
6. Supabase usuwa użytkownika (cascade: fiszki, generacje)
7. Wylogowanie i redirect do `/`

#### Scenariusz 6: Niezalogowany Użytkownik Próbuje Dostać Się do Chronionej Strony
1. Użytkownik wpisuje `/dashboard` w przeglądarce
2. Middleware sprawdza sesję → brak sesji
3. Redirect do `/login?redirect=/dashboard`
4. Po zalogowaniu → redirect do `/dashboard`

---

## 2. LOGIKA BACKENDOWA

### 2.1 Struktura API Endpoints

#### 2.1.1 Nowe Endpointy Autoryzacji

**POST `/api/auth/register`**
- **Plik:** `src/pages/api/auth/register.ts`
- **Prerender:** `false`
- **Request Body:**
  ```typescript
  {
    email: string;      // format emaila
    password: string;   // min. 8 znaków, 1 wielka, 1 cyfra
  }
  ```
- **Walidacja (Zod Schema):**
  ```typescript
  const registerSchema = z.object({
    email: z.string().email('Nieprawidłowy format emaila'),
    password: z.string()
      .min(8, 'Hasło musi mieć minimum 8 znaków')
      .regex(/[A-Z]/, 'Hasło musi zawierać wielką literę')
      .regex(/[0-9]/, 'Hasło musi zawierać cyfrę'),
  });
  ```
- **Logika:**
  1. Walidacja danych wejściowych
  2. Wywołanie `supabase.auth.signUp({ email, password })`
  3. Supabase automatycznie wysyła email weryfikacyjny
  4. Zwrócenie sukcesu (201) z komunikatem o weryfikacji
- **Obsługa Błędów:**
  - Email już istnieje → 409 CONFLICT
  - Słabe hasło → 422 UNPROCESSABLE_ENTITY
  - Błąd Supabase → 500 INTERNAL_SERVER_ERROR
- **Response (Success):**
  ```typescript
  {
    message: "Rejestracja pomyślna. Sprawdź email w celu weryfikacji konta.",
    requiresEmailConfirmation: true
  }
  ```

**POST `/api/auth/login`**
- **Plik:** `src/pages/api/auth/login.ts`
- **Request Body:**
  ```typescript
  {
    email: string;
    password: string;
  }
  ```
- **Walidacja:**
  ```typescript
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Hasło jest wymagane'),
  });
  ```
- **Logika:**
  1. Walidacja danych
  2. Wywołanie `supabase.auth.signInWithPassword({ email, password })`
  3. Ustawienie session cookie (Supabase zarządza automatycznie)
  4. Zwrócenie danych użytkownika
- **Obsługa Błędów:**
  - Nieprawidłowe credentials → 401 UNAUTHORIZED
  - Email niepotwierdzony → 403 FORBIDDEN
  - Rate limit → 429 TOO_MANY_REQUESTS
- **Response (Success):**
  ```typescript
  {
    user: {
      id: string;
      email: string;
      emailConfirmed: boolean;
    },
    redirectTo: string; // z query params lub default '/dashboard'
  }
  ```

**POST `/api/auth/logout`**
- **Plik:** `src/pages/api/auth/logout.ts`
- **Request:** Brak body
- **Logika:**
  1. Wywołanie `supabase.auth.signOut()`
  2. Usunięcie session cookie
  3. Zwrócenie sukcesu
- **Response:**
  ```typescript
  {
    message: "Wylogowano pomyślnie"
  }
  ```

**POST `/api/auth/forgot-password`**
- **Plik:** `src/pages/api/auth/forgot-password.ts`
- **Request Body:**
  ```typescript
  {
    email: string;
  }
  ```
- **Logika:**
  1. Walidacja emaila
  2. Wywołanie `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://app.com/reset-password' })`
  3. Supabase wysyła email z tokenem resetującym
  4. Zwrócenie sukcesu (nawet jeśli email nie istnieje - security best practice)
- **Response:**
  ```typescript
  {
    message: "Jeśli konto z tym emailem istnieje, został wysłany link resetujący"
  }
  ```

**POST `/api/auth/reset-password`**
- **Plik:** `src/pages/api/auth/reset-password.ts`
- **Request Body:**
  ```typescript
  {
    token: string;      // z URL query params
    password: string;   // nowe hasło
  }
  ```
- **Walidacja:**
  ```typescript
  const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/),
  });
  ```
- **Logika:**
  1. Walidacja tokenu i hasła
  2. Wywołanie `supabase.auth.updateUser({ password })`
     - Supabase automatycznie weryfikuje token z sesji
  3. Zwrócenie sukcesu
- **Obsługa Błędów:**
  - Wygasły token → 401 UNAUTHORIZED
  - Słabe hasło → 422 UNPROCESSABLE_ENTITY

**POST `/api/auth/change-password`**
- **Plik:** `src/pages/api/auth/change-password.ts`
- **Request Body:**
  ```typescript
  {
    currentPassword: string;
    newPassword: string;
  }
  ```
- **Logika:**
  1. Pobranie user ID z `locals.user` (z middleware)
  2. Weryfikacja obecnego hasła przez `signInWithPassword`
  3. Jeśli poprawne → `updateUser({ password: newPassword })`
  4. Zwrócenie sukcesu
- **Obsługa Błędów:**
  - Nieprawidłowe obecne hasło → 401 UNAUTHORIZED
  - Niezalogowany → 401 UNAUTHORIZED

**DELETE `/api/auth/delete-account`**
- **Plik:** `src/pages/api/auth/delete-account.ts`
- **Request:** Brak body
- **Logika:**
  1. Pobranie user ID z `locals.user`
  2. Wywołanie Supabase Admin API: `supabase.auth.admin.deleteUser(userId)`
     - CASCADE: automatyczne usunięcie fiszek i generacji (foreign key constraints)
  3. Wylogowanie użytkownika
  4. Zwrócenie sukcesu
- **Uwaga:** Wymaga Supabase Service Role Key (admin operation)
- **Response:**
  ```typescript
  {
    message: "Konto zostało trwale usunięte"
  }
  ```

#### 2.1.2 Aktualizacja Istniejących Endpointów

**Wszystkie endpointy w `/api/flashcards/*` i `/api/generations/*`:**

**Przed (MVP Mock):**
```typescript
const PLACEHOLDER_USER_ID = '00000000-0000-0000-0000-000000000000';
const userId = locals.user?.id || PLACEHOLDER_USER_ID;
```

**Po (Pełna Autoryzacja):**
```typescript
// Usunięcie PLACEHOLDER_USER_ID
// Middleware gwarantuje, że locals.user istnieje
const userId = locals.user.id;

// Dodatkowe sprawdzenie (defensive programming):
if (!userId) {
  return new Response(
    JSON.stringify({ 
      error: { 
        code: 'UNAUTHORIZED', 
        message: 'Authentication required' 
      } 
    }),
    { status: 401 }
  );
}
```

**Zmiana struktury:**
- Usunięcie wszystkich fallbacków do `PLACEHOLDER_USER_ID`
- Middleware już wymusza autoryzację przed dotarciem do endpointów
- Endpointy mogą założyć, że `locals.user` zawsze istnieje

### 2.2 Walidacja Danych Wejściowych (Zod Schemas)

#### 2.2.1 Nowy Plik Walidacji

**`src/lib/validation/auth.schemas.ts`**

```typescript
import { z } from 'zod';

/**
 * Wspólne reguły walidacji hasła
 */
const passwordValidation = z
  .string()
  .min(8, 'Hasło musi mieć minimum 8 znaków')
  .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
  .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę');

/**
 * Schema dla rejestracji
 */
export const registerSchema = z.object({
  email: z.string().email('Nieprawidłowy format adresu email'),
  password: passwordValidation,
});

/**
 * Schema dla logowania
 */
export const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy format adresu email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

/**
 * Schema dla forgot password
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Nieprawidłowy format adresu email'),
});

/**
 * Schema dla reset password
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token jest wymagany'),
  password: passwordValidation,
});

/**
 * Schema dla change password
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Obecne hasło jest wymagane'),
  newPassword: passwordValidation,
});

/**
 * Type exports dla TypeScript
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
```

#### 2.2.2 Wzorzec Użycia w API Endpoints

```typescript
// W każdym endpoincie:
export async function POST({ request, locals }: APIContext) {
  try {
    const body = await request.json();
    
    const validation = someSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return badRequest(firstError.message, {
        field: firstError.path[0]?.toString(),
      });
    }
    
    const data = validation.data;
    // ... reszta logiki
  } catch (error) {
    return internalServerError('Internal server error');
  }
}
```

### 2.3 Obsługa Wyjątków i Błędów

#### 2.3.1 Nowe Kody Błędów

**Rozszerzenie `src/types.ts` - ApiErrorCode:**
```typescript
export type ApiErrorCode =
  | 'VALIDATION_ERROR'          // Błędy walidacji (400)
  | 'UNAUTHORIZED'              // Brak autoryzacji (401)
  | 'FORBIDDEN'                 // Brak dostępu (403)
  | 'NOT_FOUND'                 // Zasób nie znaleziony (404)
  | 'CONFLICT'                  // Konflikt (409, np. email exists)
  | 'UNPROCESSABLE_ENTITY'      // Błąd logiki biznesowej (422)
  | 'RATE_LIMIT_EXCEEDED'       // Przekroczono limit (429)
  | 'INTERNAL_SERVER_ERROR'     // Błąd serwera (500)
  | 'SERVICE_UNAVAILABLE';      // Usługa niedostępna (503)
```

#### 2.3.2 Obsługa Błędów Supabase Auth

**Mapowanie błędów Supabase na ApiErrorCode:**

```typescript
// src/lib/utils/auth-errors.ts (nowy plik)

import { AuthError } from '@supabase/supabase-js';
import type { ApiErrorCode } from '@/types';

export function mapSupabaseAuthError(error: AuthError): {
  code: ApiErrorCode;
  message: string;
} {
  // Email already registered
  if (error.message.includes('already registered')) {
    return {
      code: 'CONFLICT',
      message: 'Użytkownik z tym adresem email już istnieje',
    };
  }

  // Invalid credentials
  if (error.message.includes('Invalid login credentials')) {
    return {
      code: 'UNAUTHORIZED',
      message: 'Nieprawidłowy email lub hasło',
    };
  }

  // Email not confirmed
  if (error.message.includes('Email not confirmed')) {
    return {
      code: 'FORBIDDEN',
      message: 'Potwierdź swój adres email przed zalogowaniem',
    };
  }

  // Weak password
  if (error.message.includes('Password')) {
    return {
      code: 'UNPROCESSABLE_ENTITY',
      message: 'Hasło nie spełnia wymagań bezpieczeństwa',
    };
  }

  // Rate limit
  if (error.status === 429) {
    return {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Zbyt wiele prób. Spróbuj ponownie później',
    };
  }

  // Default
  return {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Wystąpił nieoczekiwany błąd',
  };
}
```

**Użycie w API:**
```typescript
try {
  const { data, error } = await supabase.auth.signUp({ email, password });
  
  if (error) {
    const { code, message } = mapSupabaseAuthError(error);
    
    if (code === 'CONFLICT') {
      return conflict(message);
    } else if (code === 'UNPROCESSABLE_ENTITY') {
      return unprocessableEntity(message);
    } else {
      return internalServerError(message);
    }
  }
  
  // success...
} catch (error) {
  return internalServerError('Internal server error');
}
```

#### 2.3.3 Rate Limiting

**Strategia:**
- Supabase Auth ma wbudowany rate limiting
- Domyślnie: max 10 prób logowania/minutę z jednego IP
- W przypadku przekroczenia: błąd 429
- Konfiguracja w Supabase Dashboard (opcjonalnie)

**Obsługa w UI:**
```typescript
if (response.status === 429) {
  toast.error('Zbyt wiele prób logowania', {
    description: 'Spróbuj ponownie za 60 sekund'
  });
}
```

### 2.4 Server-Side Rendering (SSR) - Aktualizacja

#### 2.4.1 Middleware - Włączenie Autentykacji

**`src/middleware/index.ts` - Aktualizacja:**

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  const { request, redirect, locals } = context;
  
  // Dodaj supabaseClient do locals
  locals.supabase = supabaseClient;
  
  const url = new URL(request.url);
  
  // Publiczne ścieżki (dostępne bez logowania)
  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicPath = publicPaths.includes(url.pathname);
  
  // Auth API endpoints są zawsze publiczne
  const isAuthAPI = url.pathname.startsWith('/api/auth/');
  
  // Sprawdź sesję użytkownika
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  const isAuthenticated = !!session && !error;
  
  // USUNIĘCIE MOCK USER - teraz wymuszamy prawdziwą autentykację
  
  if (isAuthenticated && session?.user) {
    // Użytkownik zalogowany - dodaj do locals
    locals.user = {
      id: session.user.id,
      email: session.user.email!,
      username: session.user.user_metadata?.username,
      avatar_url: session.user.user_metadata?.avatar_url,
    };
    
    // Jeśli zalogowany próbuje wejść na /login lub /register
    if (url.pathname === '/login' || url.pathname === '/register') {
      return redirect('/dashboard');
    }
  } else {
    // Użytkownik NIE zalogowany
    
    // Jeśli próbuje dostać się do chronionej strony
    if (!isPublicPath && !isAuthAPI) {
      // Zapisz oryginalny URL jako redirect parameter
      const redirectTo = url.pathname + url.search;
      return redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
    }
  }
  
  return next();
});
```

**Kluczowe zmiany:**
1. ✅ **Usunięcie całego bloku z fake/mock userem**
2. ✅ **Włączenie sprawdzania autentykacji dla chronionych stron**
3. ✅ **Przekierowanie niezalogowanych użytkowników do `/login`**
4. ✅ **Dodanie query param `redirect` dla lepszego UX**
5. ✅ **Auth API endpoints są publiczne (nie wymagają logowania)**

#### 2.4.2 Server-Side Data Fetching w Stronach

**Aktualizacja `src/pages/dashboard.astro`:**

```astro
---
import Layout from '../layouts/Layout.astro';
import { DashboardContent } from '../components/dashboard/DashboardContent';

// Middleware już zweryfikował użytkownika
// Jeśli dotarliśmy tutaj, user ZAWSZE istnieje
const user = Astro.locals.user;

// Opcjonalnie: pre-fetch danych z API
// const stats = await fetch(`${Astro.url.origin}/api/dashboard/stats`, {
//   headers: { Cookie: Astro.request.headers.get('Cookie') || '' }
// }).then(r => r.json());
---

<Layout title="Dashboard - 10x cards">
  <DashboardContent client:load initialUser={user} />
</Layout>
```

**Podobnie dla innych chronionych stron:**
- `/flashcards.astro`
- `/generate.astro`
- `/study.astro`
- `/generations.astro`
- `/generations/[id].astro`
- `/settings.astro` (nowa)

Wszystkie mogą założyć, że `Astro.locals.user` jest zdefiniowany.

#### 2.4.3 Obsługa Redirect Query Param

**W `LoginForm.tsx`:**
```typescript
const handleLoginSuccess = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get('redirect') || '/dashboard';
  
  window.location.href = redirectTo;
};
```

---

## 3. SYSTEM AUTENTYKACJI - Supabase Auth + Astro

### 3.1 Architektura Supabase Auth

#### 3.1.1 Flow Autentykacji

**Rejestracja (Sign Up):**
```
1. User → RegisterForm → POST /api/auth/register
2. API → supabase.auth.signUp({ email, password })
3. Supabase:
   - Tworzy użytkownika w auth.users
   - Wysyła email weryfikacyjny
   - Zwraca user (bez sesji)
4. User klika link w emailu
5. Supabase weryfikuje email → user.email_confirmed = true
6. User może się zalogować
```

**Logowanie (Sign In):**
```
1. User → LoginForm → POST /api/auth/login
2. API → supabase.auth.signInWithPassword({ email, password })
3. Supabase:
   - Weryfikuje credentials
   - Tworzy sesję JWT
   - Ustawia cookie (przez Supabase SDK)
4. API → zwraca user + redirect URL
5. Frontend → redirect do dashboard
```

**Sesja (Session Management):**
```
1. Każde żądanie do API:
   - Middleware wywołuje supabase.auth.getSession()
   - Supabase odczytuje JWT z cookies
   - Jeśli ważny → zwraca session + user
   - Jeśli wygasły → zwraca null
2. Middleware:
   - Jeśli session → locals.user = user
   - Jeśli brak → redirect /login (dla protected routes)
```

**Wylogowanie (Sign Out):**
```
1. User → DashboardHeader → POST /api/auth/logout
2. API → supabase.auth.signOut()
3. Supabase:
   - Usuwa sesję z bazy
   - Czyści cookie
4. Frontend → redirect do /login
```

#### 3.1.2 JWT Tokens i Cookies

**Typ Tokenu:**
- Supabase używa JWT (JSON Web Tokens)
- Przechowywane w HTTP-only cookies (bezpieczne, nie dostępne z JS)
- Automatyczna rotacja przy zbliżającym się wygaśnięciu

**Struktura Cookies:**
- Cookie name: `sb-access-token` (domyślnie)
- Attributes: `HttpOnly`, `Secure` (w production), `SameSite=Lax`
- TTL: 3600s (1 godzina) - konfigurowane w Supabase

**Refresh Token:**
- Supabase automatycznie odświeża tokeny
- SDK zarządza refresh token flow w tle
- Developer nie musi ręcznie implementować

#### 3.1.3 Konfiguracja Supabase Client

**Aktualizacja `src/db/supabase.client.ts`:**

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Supabase client z konfiguracją auth
 * Używany zarówno po stronie serwera (middleware, API) jak i klienta (React)
 */
export const supabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Automatyczne zarządzanie sesjami
      autoRefreshToken: true,
      
      // Persist sesji w localStorage (dla klienta) i cookies (dla serwera)
      persistSession: true,
      
      // Wykrywanie zmian sesji
      detectSessionInUrl: true,
      
      // Storage dla tokenów (cookies w SSR, localStorage w browser)
      storage: typeof window !== 'undefined' 
        ? window.localStorage 
        : undefined,
    }
  }
);

export type SupabaseClient = typeof supabaseClient;
```

**Zmienne Środowiskowe (.env):**
```bash
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Dla operacji admin (delete user)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.2 Konfiguracja Email Templates (Supabase Dashboard)

**Email Weryfikacyjny (Confirm Signup):**
- Template w Supabase Dashboard → Authentication → Email Templates
- URL Redirect: `https://app.com/login?confirmed=true`
- Treść:
  ```html
  <h2>Potwierdź swój adres email</h2>
  <p>Kliknij poniższy link, aby aktywować konto w 10x cards:</p>
  <a href="{{ .ConfirmationURL }}">Potwierdź email</a>
  ```

**Email Resetowania Hasła (Reset Password):**
- URL Redirect: `https://app.com/reset-password`
- Token przekazywany w query params (automatycznie przez Supabase)
- Treść:
  ```html
  <h2>Zresetuj hasło</h2>
  <p>Kliknij poniższy link, aby ustawić nowe hasło:</p>
  <a href="{{ .ConfirmationURL }}">Resetuj hasło</a>
  <p>Link wygasa po 1 godzinie.</p>
  ```

**Email Change Email (opcjonalnie):**
- Gdy użytkownik zmienia adres email
- Wymaga potwierdzenia zarówno starego jak i nowego emaila

### 3.3 Row Level Security (RLS) - Włączenie

**Obecna sytuacja:**
- RLS policies są zdefiniowane w `20251006120000_initial_schema.sql`
- Ale są WYŁĄCZONE w `20251006180000_disable_rls_for_mvp.sql`

**Migracja do Włączenia RLS:**

**Nowy plik: `supabase/migrations/20251014000000_enable_rls_with_auth.sql`**

```sql
-- =====================================================
-- Migration: Enable RLS with Full Authentication
-- Purpose: Remove development bypass and enforce auth
-- =====================================================

-- =====================================================
-- 1. USUNIĘCIE TESTOWEGO UŻYTKOWNIKA (jeśli istnieje)
-- =====================================================

-- Usuń wszystkie dane powiązane z placeholder userem
DELETE FROM public.flashcards 
WHERE user_id = '00000000-0000-0000-0000-000000000000';

DELETE FROM public.generations 
WHERE user_id = '00000000-0000-0000-0000-000000000000';

DELETE FROM public.generation_error_logs 
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Usuń testowego użytkownika (jeśli został stworzony)
-- Uwaga: to wymaga admin permissions
-- DELETE FROM auth.users 
-- WHERE id = '00000000-0000-0000-0000-000000000000';

-- =====================================================
-- 2. WŁĄCZENIE RLS (już włączone, ale dla pewności)
-- =====================================================

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_error_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. POTWIERDZENIE POLICIES (już istnieją)
-- =====================================================

-- Policies zostały utworzone w initial_schema.sql
-- Sprawdzamy czy działają poprawnie:

-- Test: Anon użytkownik NIE MOŻE czytać
-- SELECT * FROM flashcards; -- powinno zwrócić 0 rows (jako anon)

-- Test: Authenticated użytkownik WIDZI tylko swoje
-- SELECT * FROM flashcards WHERE user_id = auth.uid(); -- jako zalogowany

-- =====================================================
-- 4. DODATKOWE ZABEZPIECZENIA
-- =====================================================

-- Funkcja pomocnicza: sprawdź czy użytkownik jest właścicielem
CREATE OR REPLACE FUNCTION public.is_owner(resource_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT resource_user_id = auth.uid();
$$;

-- Grant execute na funkcję
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO authenticated;

-- =====================================================
-- 5. KONFIGURACJA AUTH (opcjonalne constraints)
-- =====================================================

-- Upewnij się, że każdy rekord ma user_id
ALTER TABLE public.flashcards 
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.generations 
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.generation_error_logs 
  ALTER COLUMN user_id SET NOT NULL;

-- =====================================================
-- 6. INDEKSY DLA WYDAJNOŚCI RLS
-- =====================================================

-- Te indeksy już istnieją, ale dla pewności:
CREATE INDEX IF NOT EXISTS flashcards_user_id_idx 
  ON public.flashcards(user_id);

CREATE INDEX IF NOT EXISTS generations_user_id_idx 
  ON public.generations(user_id);

CREATE INDEX IF NOT EXISTS generation_error_logs_user_id_idx 
  ON public.generation_error_logs(user_id);

-- =====================================================
-- KONIEC MIGRACJI
-- =====================================================
```

**Uruchomienie migracji:**
```bash
# Lokalnie (Supabase CLI)
supabase db push

# Lub w production (Supabase Dashboard)
# Wykonaj SQL w SQL Editor
```

**Weryfikacja:**
```sql
-- Sprawdź czy RLS jest włączony
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Sprawdź policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### 3.4 Obsługa Usuwania Konta (CASCADE)

**Database Constraints:**
```sql
-- flashcards.user_id → auth.users(id) ON DELETE CASCADE
-- generations.user_id → auth.users(id) ON DELETE CASCADE
-- generation_error_logs.user_id → auth.users(id) ON DELETE CASCADE
```

**Flow Usuwania Konta:**
```
1. User → DELETE /api/auth/delete-account
2. API → supabase.auth.admin.deleteUser(userId)
3. PostgreSQL triggers CASCADE DELETE:
   - DELETE FROM flashcards WHERE user_id = userId
   - DELETE FROM generations WHERE user_id = userId
   - DELETE FROM generation_error_logs WHERE user_id = userId
   - DELETE FROM auth.users WHERE id = userId
4. API → supabase.auth.signOut()
5. Frontend → redirect do '/'
```

**Implementacja w API:**
```typescript
// src/pages/api/auth/delete-account.ts
export async function DELETE({ locals }: APIContext) {
  const userId = locals.user?.id;
  
  if (!userId) {
    return unauthorized('Authentication required');
  }
  
  try {
    // Użyj service role key dla admin operations
    const supabaseAdmin = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    // Usuń użytkownika (CASCADE delete dla wszystkich danych)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error('Delete user error:', error);
      return internalServerError('Failed to delete account');
    }
    
    // Wyloguj sesję
    await locals.supabase.auth.signOut();
    
    return successResponse({ 
      message: 'Konto zostało trwale usunięte' 
    }, 200);
    
  } catch (error) {
    console.error('Unexpected error deleting account:', error);
    return internalServerError('Internal server error');
  }
}
```

### 3.5 Best Practices i Security

#### 3.5.1 Bezpieczeństwo Haseł
- ✅ Minimalne wymagania: 8 znaków, 1 wielka litera, 1 cyfra
- ✅ Supabase hashuje hasła z bcrypt
- ✅ Nigdy nie przechowuj plaintext passwords
- ✅ Nie zwracaj haseł w API responses

#### 3.5.2 Protection przed Atakami
- ✅ **CSRF Protection:** Supabase cookies z `SameSite=Lax`
- ✅ **XSS Protection:** HTTP-only cookies (JS nie może czytać)
- ✅ **SQL Injection:** Supabase prepared statements + RLS
- ✅ **Rate Limiting:** Wbudowane w Supabase Auth (10 req/min/IP)
- ✅ **Brute Force:** Rate limiting + opcjonalna CAPTCHA (Supabase dashboard)

#### 3.5.3 RODO Compliance
- ✅ **Prawo do dostępu:** User może zobaczyć swoje dane (dashboard)
- ✅ **Prawo do usunięcia:** DELETE `/api/auth/delete-account`
- ✅ **Prawo do przenoszenia:** Export danych (feature dla przyszłości)
- ✅ **Szyfrowanie:** HTTPS dla wszystkich połączeń
- ✅ **Consent:** Checkbox "Akceptuję regulamin" w rejestracji

#### 3.5.4 Error Handling Best Practices
- ✅ Nie ujawniaj szczegółów wewnętrznych błędów użytkownikowi
- ✅ Loguj błędy po stronie serwera (console.error)
- ✅ Zwracaj generyczne komunikaty dla security errors
- ✅ Przykład: "Nieprawidłowy email lub hasło" (zamiast "Email nie istnieje")

### 3.6 Testing Strategy

#### 3.6.1 Manual Testing Checklist
- [ ] Rejestracja nowego użytkownika → email weryfikacyjny
- [ ] Potwierdzenie emaila → możliwość logowania
- [ ] Logowanie z poprawnymi credentials → redirect do dashboard
- [ ] Logowanie z błędnymi credentials → error message
- [ ] Próba dostępu do chronionej strony bez logowania → redirect /login
- [ ] Wylogowanie → redirect /login, brak dostępu do chronionych stron
- [ ] Forgot password → email z linkiem
- [ ] Reset password → nowe hasło działa
- [ ] Change password w settings → stare hasło nie działa
- [ ] Delete account → dane usunięte, wylogowanie

#### 3.6.2 E2E Tests (opcjonalnie - Playwright)
```typescript
// tests/auth.spec.ts
test('user can register and login', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'Test1234');
  await page.click('button[type="submit"]');
  
  // Sprawdź komunikat o weryfikacji
  await expect(page.locator('text=Sprawdź email')).toBeVisible();
  
  // Manualnie potwierdź email (lub mock Supabase response)
  
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'Test1234');
  await page.click('button[type="submit"]');
  
  // Sprawdź redirect do dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

---

## 4. PLAN IMPLEMENTACJI (Kolejność Zadań)

### Faza 1: Backend i Database (Priority: Critical)
1. ✅ Utworzenie migracji SQL: `20251014000000_enable_rls_with_auth.sql`
2. ✅ Utworzenie auth schemas: `src/lib/validation/auth.schemas.ts`
3. ✅ Utworzenie auth error mapper: `src/lib/utils/auth-errors.ts`
4. ✅ Implementacja API endpoints:
   - `src/pages/api/auth/register.ts`
   - `src/pages/api/auth/login.ts`
   - `src/pages/api/auth/logout.ts`
   - `src/pages/api/auth/forgot-password.ts`
   - `src/pages/api/auth/reset-password.ts`
   - `src/pages/api/auth/change-password.ts`
   - `src/pages/api/auth/delete-account.ts`
5. ✅ Aktualizacja middleware: włączenie auth protection
6. ✅ Usunięcie PLACEHOLDER_USER_ID z istniejących API endpoints

### Faza 2: Frontend - Strony i Formularze (Priority: Critical)
7. ✅ Utworzenie MinimalLayout (jeśli nie istnieje) lub użycie istniejącego
8. ✅ Utworzenie stron Astro:
   - `src/pages/login.astro`
   - `src/pages/register.astro`
   - `src/pages/forgot-password.astro`
   - `src/pages/reset-password.astro`
   - `src/pages/settings.astro`
9. ✅ Utworzenie komponentów React:
   - `src/components/auth/LoginForm.tsx`
   - `src/components/auth/RegisterForm.tsx`
   - `src/components/auth/ForgotPasswordForm.tsx`
   - `src/components/auth/ResetPasswordForm.tsx`
   - `src/components/auth/PasswordStrengthIndicator.tsx`
10. ✅ Utworzenie komponentów Settings:
    - `src/components/settings/SettingsView.tsx`
    - `src/components/settings/ChangePasswordForm.tsx`
    - `src/components/settings/DeleteAccountSection.tsx`

### Faza 3: UX i Integracja (Priority: High)
11. ✅ Aktualizacja `index.astro`: dodanie CTA buttons
12. ✅ Aktualizacja `DashboardHeader.tsx`: implementacja logout
13. ✅ Dodanie linku "Ustawienia" do menu użytkownika
14. ✅ Testowanie flow: register → confirm → login → logout
15. ✅ Testowanie flow: forgot password → reset → login
16. ✅ Testowanie flow: change password w settings
17. ✅ Testowanie flow: delete account

### Faza 4: Supabase Configuration (Priority: High)
18. ✅ Konfiguracja Email Templates w Supabase Dashboard:
    - Confirm Signup template
    - Reset Password template
19. ✅ Konfiguracja Redirect URLs w Supabase:
    - Allowed redirect URLs: `https://app.com/*`
20. ✅ Konfiguracja Auth settings:
    - Email confirmation required: ON
    - Minimum password length: 8
21. ✅ Uruchomienie migracji RLS: `supabase db push`

### Faza 5: Security i Compliance (Priority: Medium)
22. ✅ Weryfikacja RLS policies: test jako anon i authenticated
23. ✅ Dodanie RODO checkbox w RegisterForm
24. ✅ Utworzenie strony `/privacy-policy` (statyczna)
25. ✅ Utworzenie strony `/terms-of-service` (statyczna)
26. ✅ Security audit: sprawdzenie OWASP top 10

### Faza 6: Testing i Documentation (Priority: Low)
27. ✅ Manual testing wszystkich flows
28. ✅ E2E tests (opcjonalnie)
29. ✅ Aktualizacja dokumentacji PRD
30. ✅ Utworzenie User Guide (jak korzystać z auth)

---

## 5. DIAGRAM ARCHITEKTURY

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ /login       │  │ /register    │  │ /forgot-pwd  │     │
│  │ LoginForm    │  │ RegisterForm │  │ ForgotPwdForm│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────────────────────────┐   │
│  │ /reset-pwd   │  │ /settings                        │   │
│  │ ResetPwdForm │  │ ChangePasswordForm               │   │
│  └──────────────┘  │ DeleteAccountSection             │   │
│                    └──────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ /dashboard (+ inne protected routes)                │  │
│  │ DashboardHeader → Logout Button                     │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP Requests
┌─────────────────────────────────────────────────────────────┐
│                    ASTRO MIDDLEWARE                         │
│                                                             │
│  1. Pobierz session z Supabase (JWT z cookies)             │
│  2. Jeśli authenticated → locals.user = user               │
│  3. Jeśli not authenticated + protected route → /login     │
│  4. Jeśli authenticated + /login → /dashboard              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       API ENDPOINTS                         │
│                                                             │
│  POST /api/auth/register        POST /api/auth/login       │
│  POST /api/auth/logout          POST /api/auth/forgot-pwd  │
│  POST /api/auth/reset-pwd       POST /api/auth/change-pwd  │
│  DELETE /api/auth/delete-account                           │
│                                                             │
│  GET/POST /api/flashcards/*     (authenticated)            │
│  GET/POST /api/generations/*    (authenticated)            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE AUTH                          │
│                                                             │
│  • signUp({ email, password })                             │
│  • signInWithPassword({ email, password })                 │
│  • signOut()                                               │
│  • resetPasswordForEmail(email)                            │
│  • updateUser({ password })                                │
│  • admin.deleteUser(userId)                                │
│                                                             │
│  → JWT Session Management (auto refresh)                   │
│  → Email Templates (confirm, reset)                        │
│  → Rate Limiting (10 req/min)                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                      │
│                                                             │
│  auth.users (managed by Supabase)                          │
│    ├─ id (uuid, PK)                                        │
│    ├─ email (unique)                                       │
│    ├─ encrypted_password (bcrypt)                          │
│    ├─ email_confirmed_at                                   │
│    └─ user_metadata (jsonb)                                │
│                                                             │
│  public.flashcards (RLS enabled)                           │
│    ├─ id, user_id (FK → auth.users ON DELETE CASCADE)     │
│    └─ RLS: user_id = auth.uid()                            │
│                                                             │
│  public.generations (RLS enabled)                          │
│    ├─ id, user_id (FK → auth.users ON DELETE CASCADE)     │
│    └─ RLS: user_id = auth.uid()                            │
│                                                             │
│  public.generation_error_logs (RLS enabled)                │
│    ├─ id, user_id (FK → auth.users ON DELETE CASCADE)     │
│    └─ RLS: user_id = auth.uid()                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. KLUCZOWE PLIKI DO UTWORZENIA/MODYFIKACJI

### Nowe Pliki (do utworzenia):
```
src/pages/
  ├─ login.astro                           ✅ NEW
  ├─ register.astro                        ✅ NEW
  ├─ forgot-password.astro                 ✅ NEW
  ├─ reset-password.astro                  ✅ NEW
  └─ settings.astro                        ✅ NEW

src/pages/api/auth/
  ├─ register.ts                           ✅ NEW
  ├─ login.ts                              ✅ NEW
  ├─ logout.ts                             ✅ NEW
  ├─ forgot-password.ts                    ✅ NEW
  ├─ reset-password.ts                     ✅ NEW
  ├─ change-password.ts                    ✅ NEW
  └─ delete-account.ts                     ✅ NEW

src/components/auth/
  ├─ LoginForm.tsx                         ✅ NEW
  ├─ RegisterForm.tsx                      ✅ NEW
  ├─ ForgotPasswordForm.tsx                ✅ NEW
  ├─ ResetPasswordForm.tsx                 ✅ NEW
  ├─ PasswordStrengthIndicator.tsx         ✅ NEW
  └─ index.ts                              ✅ NEW

src/components/settings/
  ├─ SettingsView.tsx                      ✅ NEW
  ├─ ChangePasswordForm.tsx                ✅ NEW
  ├─ DeleteAccountSection.tsx              ✅ NEW
  └─ index.ts                              ✅ NEW

src/lib/validation/
  └─ auth.schemas.ts                       ✅ NEW

src/lib/utils/
  └─ auth-errors.ts                        ✅ NEW

supabase/migrations/
  └─ 20251014000000_enable_rls_with_auth.sql   ✅ NEW
```

### Pliki do Modyfikacji:
```
src/middleware/index.ts                    🔧 MODIFY (włączyć auth)
src/db/supabase.client.ts                  🔧 MODIFY (config auth)
src/pages/index.astro                      🔧 MODIFY (dodać CTA)
src/components/dashboard/DashboardHeader.tsx   🔧 MODIFY (logout)
src/pages/api/flashcards/index.ts          🔧 MODIFY (usunąć mock)
src/pages/api/flashcards/[id].ts           🔧 MODIFY (usunąć mock)
src/pages/api/generations/index.ts         🔧 MODIFY (usunąć mock)
src/pages/api/generations/[id].ts          🔧 MODIFY (usunąć mock)
src/types.ts                               🔧 MODIFY (dodać auth types)
```

---

## 7. ZMIENNE ŚRODOWISKOWE

**`.env` (development & production):**
```bash
# Supabase Connection
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx

# Supabase Service Role (dla admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx

# App URLs (dla redirect w emailach)
PUBLIC_APP_URL=https://app.10x-cards.com

# OpenRouter (istniejące)
OPENROUTER_API_KEY=sk-xxx
```

**Supabase Dashboard Config:**
- **Site URL:** `https://app.10x-cards.com`
- **Redirect URLs:**
  - `https://app.10x-cards.com/login`
  - `https://app.10x-cards.com/reset-password`
  - `http://localhost:4321/login` (dev)
  - `http://localhost:4321/reset-password` (dev)

---

## 8. PODSUMOWANIE

### Główne Punkty Architektoniczne:

1. **Routing i Nawigacja:**
   - 5 nowych stron publicznych: login, register, forgot-password, reset-password, settings
   - Middleware wymusza autoryzację dla wszystkich protected routes
   - Redirect flow z query params dla lepszego UX

2. **Komponenty Frontend:**
   - Wszystkie formularze w React (interaktywność)
   - Wykorzystanie shadcn/ui dla spójności
   - Real-time walidacja i feedback
   - Toast notifications dla komunikatów

3. **API Backend:**
   - 7 nowych endpointów w `/api/auth/*`
   - Walidacja z Zod schemas
   - Mapowanie błędów Supabase na przyjazne komunikaty
   - Usunięcie mock user - pełna autoryzacja

4. **Supabase Auth:**
   - Pełna integracja z Supabase Auth
   - JWT sessions w HTTP-only cookies
   - Email confirmation flow
   - Password reset flow
   - Admin operations (delete user)

5. **Security:**
   - RLS policies włączone
   - CASCADE delete dla user data
   - Rate limiting (Supabase)
   - CSRF/XSS protection
   - RODO compliance

6. **Database:**
   - Migracja włączająca RLS
   - Usunięcie testowych danych
   - Constraints NOT NULL dla user_id
   - Indeksy dla wydajności

### Status Gotowości:
- ✅ Architektura w pełni zaprojektowana
- ✅ Wszystkie komponenty zidentyfikowane
- ✅ Security considerations uwzględnione
- ✅ RODO compliance zapewnione
- ✅ Plan implementacji określony
- ✅ Testing strategy zdefiniowana

### Następne Kroki dla Developera:
1. Przeczytać tę specyfikację w całości
2. Skonfigurować Supabase Dashboard (email templates, redirect URLs)
3. Implementować według kolejności w "Plan Implementacji"
4. Testować każdy flow po implementacji
5. Deploy na production z odpowiednimi zmiennymi środowiskowymi

---

**Koniec Specyfikacji Technicznej**

*Dokument wersja 1.0 - 2025-01-14*

