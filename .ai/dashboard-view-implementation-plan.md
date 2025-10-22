# Plan implementacji widoku Dashboard

## 1. Przegląd

Dashboard to chroniony widok główny aplikacji 10x-cards, służący jako centrum nawigacyjne i panel przeglądu statystyk użytkownika. Widok wyświetla powitanie użytkownika, cztery karty ze statystykami dotyczącymi aktywności w aplikacji oraz cztery duże kafelki nawigacyjne prowadzące do głównych funkcji systemu (generowanie fiszek, zarządzanie fiszkami, sesja nauki, historia generacji).

Dashboard jest pierwszym widokiem prezentowanym użytkownikowi po zalogowaniu i stanowi punkt wyjścia do wszystkich kluczowych funkcji aplikacji.

## 2. Routing widoku

- **Ścieżka**: `/dashboard`
- **Typ**: Chroniony widok (wymaga uwierzytelnienia)
- **Plik**: `src/pages/dashboard.astro`
- **Middleware**: Sprawdzenie JWT tokenu w `src/middleware/index.ts`
- **Redirect**: Przekierowanie do `/login` w przypadku braku ważnego tokenu

## 3. Struktura komponentów

```
dashboard.astro (Astro page)
│
├── Layout.astro (istniejący layout)
│
└── DashboardContent (React island - client:load)
    │
    ├── DashboardHeader (React)
    │   ├── Logo (Link do /dashboard)
    │   ├── DarkModeToggle (shadcn/ui Button)
    │   └── UserDropdown (shadcn/ui DropdownMenu)
    │       ├── UserAvatar (shadcn/ui Avatar)
    │       └── LogoutButton
    │
    ├── WelcomeSection (React)
    │   └── Heading z tekstem "Witaj, {username}!"
    │
    ├── StatsSection (React)
    │   ├── StatsGrid (kontener grid)
    │   │   └── StatsCard × 4 (React)
    │   │       ├── Icon (lucide-react)
    │   │       ├── Value (liczba lub procent)
    │   │       └── Label (opis statystyki)
    │   │
    │   └── StatsSkeleton (loading state)
    │       └── StatsCardSkeleton × 4
    │
    └── NavigationSection (React)
        └── MenuGrid (kontener grid 2×2)
            └── MenuTile × 4 (React)
                ├── Icon (lucide-react)
                ├── Title (tytuł funkcji)
                └── Description (krótki opis)
```

## 4. Szczegóły komponentów

### 4.1. DashboardContent (React)

**Opis**: Główny kontener dla całej zawartości dashboardu. Komponent typu "island" renderowany po stronie klienta, zarządzający stanem i logiką biznesową widoku.

**Główne elementy**:

- `<div>` z klasami Tailwind dla layoutu
- `<DashboardHeader />` - nagłówek z nawigacją
- `<WelcomeSection />` - powitanie użytkownika
- `<StatsSection />` - sekcja ze statystykami
- `<NavigationSection />` - główne menu nawigacyjne

**Obsługiwane interakcje**:

- Inicjalizacja pobierania danych statystyk przy montowaniu komponentu
- Zarządzanie stanem ładowania i błędów
- Przekazywanie danych do komponentów dzieci

**Obsługiwana walidacja**:

- Brak (walidacja JWT odbywa się w middleware)

**Typy**:

- `DashboardStats`
- `UserProfile`

**Propsy**:

```typescript
type DashboardContentProps = {
  initialUser?: UserProfile; // Dane użytkownika przekazane z Astro
};
```

### 4.2. DashboardHeader (React)

**Opis**: Nagłówek aplikacji zawierający logo, przełącznik trybu ciemnego oraz menu użytkownika z opcją wylogowania.

**Główne elementy**:

- `<header>` - semantic header element
- `<a>` lub `<Link>` z logo "10x cards"
- `<Button>` (shadcn/ui) dla dark mode toggle z ikoną Moon/Sun (lucide-react)
- `<DropdownMenu>` (shadcn/ui) z menu użytkownika
  - `<DropdownMenuTrigger>` z `<Avatar>` użytkownika
  - `<DropdownMenuContent>`
    - `<DropdownMenuItem>` z email użytkownika (disabled)
    - `<DropdownMenuSeparator>`
    - `<DropdownMenuItem>` "Wyloguj się" z akcją logout

**Obsługiwane interakcje**:

- Kliknięcie logo → nawigacja do `/dashboard`
- Kliknięcie dark mode toggle → zmiana motywu
- Kliknięcie "Wyloguj się" → wywołanie funkcji logout

**Obsługiwana walidacja**:

- Brak

**Typy**:

- `UserProfile`

**Propsy**:

```typescript
type DashboardHeaderProps = {
  user: UserProfile;
  onLogout: () => Promise<void>;
};
```

### 4.3. WelcomeSection (React)

**Opis**: Sekcja powitalna wyświetlająca spersonalizowane powitanie użytkownika.

**Główne elementy**:

- `<section>` - semantic section element
- `<h1>` z tekstem "Witaj, {username}!" lub "Witaj, {email}!" jeśli brak username

**Obsługiwane interakcje**:

- Brak (prezentacyjny komponent)

**Obsługiwana walidacja**:

- Brak

**Typy**:

- `UserProfile`

**Propsy**:

```typescript
type WelcomeSectionProps = {
  user: UserProfile;
};
```

### 4.4. StatsSection (React)

**Opis**: Sekcja zawierająca grid czterech kart statystyk lub skeleton loader w trakcie ładowania danych.

**Główne elementy**:

- `<section>` - semantic section element
- `<h2>` z tytułem sekcji (opcjonalnie)
- `<StatsGrid>` lub `<StatsSkeleton>` w zależności od stanu ładowania

**Obsługiwane interakcje**:

- Brak (kontener prezentacyjny)

**Obsługiwana walidacja**:

- Brak

**Typy**:

- `DashboardStats`

**Propsy**:

```typescript
type StatsSectionProps = {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
};
```

### 4.5. StatsGrid (React)

**Opis**: Kontener grid (2×2 lub 4×1 na mobile) dla czterech kart statystyk.

**Główne elementy**:

- `<div>` z klasami grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`
- 4× `<StatsCard>` dla każdej statystyki

**Obsługiwane interakcje**:

- Brak

**Obsługiwana walidacja**:

- Brak

**Typy**:

- `DashboardStats`

**Propsy**:

```typescript
type StatsGridProps = {
  stats: DashboardStats;
};
```

### 4.6. StatsCard (React)

**Opis**: Pojedyncza karta wyświetlająca jedną statystykę z ikoną, wartością i opisem.

**Główne elementy**:

- `<Card>` (shadcn/ui)
- `<CardHeader>` z ikoną
- `<CardContent>`
  - `<div>` z dużą wartością statystyki
  - `<p>` z labelką/opisem statystyki
- ARIA attributes: `role="status"`, `aria-label` z pełnym opisem

**Obsługiwane interakcje**:

- Brak (prezentacyjny komponent)

**Obsługiwana walidacja**:

- Brak

**Typy**:

- `StatsCardProps`

**Propsy**:

```typescript
type StatsCardProps = {
  icon: React.ReactNode; // np. <BookOpen className="w-6 h-6" />
  value: number | string; // np. 42 lub "85%"
  label: string; // np. "Wszystkie fiszki"
  variant?: "default" | "highlight"; // opcjonalne odróżnienie wizualne
};
```

### 4.7. StatsSkeleton (React)

**Opis**: Loading state dla sekcji statystyk wyświetlający cztery skeleton loadery.

**Główne elementy**:

- `<div>` z klasami grid identycznymi jak StatsGrid
- 4× `<StatsCardSkeleton>`

**Obsługiwane interakcje**:

- Brak

**Obsługiwana walidacja**:

- Brak

**Typy**:

- Brak

**Propsy**:

- Brak (komponent bez propsów)

### 4.8. StatsCardSkeleton (React)

**Opis**: Skeleton loader dla pojedynczej karty statystyk.

**Główne elementy**:

- `<Card>` (shadcn/ui)
- `<Skeleton>` (shadcn/ui) dla ikony
- `<Skeleton>` dla wartości
- `<Skeleton>` dla labela

**Obsługiwane interakcje**:

- Brak

**Obsługiwana walidacja**:

- Brak

**Typy**:

- Brak

**Propsy**:

- Brak

### 4.9. NavigationSection (React)

**Opis**: Sekcja zawierająca główne menu nawigacyjne w formie czterech dużych kafelków.

**Główne elementy**:

- `<section>` - semantic section
- `<h2>` z tytułem sekcji (opcjonalnie)
- `<MenuGrid>`

**Obsługiwane interakcje**:

- Brak (kontener prezentacyjny)

**Obsługiwana walidacja**:

- Brak

**Typy**:

- Brak

**Propsy**:

- Brak (statyczna zawartość)

### 4.10. MenuGrid (React)

**Opis**: Kontener grid 2×2 dla czterech kafelków nawigacyjnych.

**Główne elementy**:

- `<nav>` z ARIA label "Główna nawigacja"
- `<div>` z klasami grid: `grid grid-cols-1 md:grid-cols-2 gap-6`
- 4× `<MenuTile>` dla każdej funkcji

**Obsługiwane interakcje**:

- Brak (delegowane do MenuTile)

**Obsługiwana walidacja**:

- Brak

**Typy**:

- `MenuTileProps[]` (dane kafelków)

**Propsy**:

```typescript
type MenuGridProps = {
  tiles: MenuTileProps[];
};
```

### 4.11. MenuTile (React)

**Opis**: Duży, klikalny kafelek prowadzący do jednej z głównych funkcji aplikacji. Zawiera ikonę, tytuł i krótki opis.

**Główne elementy**:

- `<Link>` lub `<a>` jako wrapper
- `<Card>` (shadcn/ui) z hover effects
- `<CardHeader>` z ikoną (duży rozmiar, np. w-12 h-12)
- `<CardTitle>` z tytułem funkcji
- `<CardDescription>` z krótkim opisem
- Hover states: scale, shadow, background color change
- Focus states dla keyboard navigation

**Obsługiwane interakcje**:

- Kliknięcie → nawigacja do `href`
- Hover → efekt wizualny (scale, shadow)
- Focus → border/outline dla keyboard navigation
- Keyboard: Enter/Space → aktywacja linku

**Obsługiwana walidacja**:

- Brak

**Typy**:

- `MenuTileProps`

**Propsy**:

```typescript
type MenuTileProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  variant?: "default" | "primary"; // opcjonalne wyróżnienie
};
```

## 5. Typy

### 5.1. Nowe typy do zdefiniowania w src/types.ts

```typescript
/**
 * Agregowane statystyki dla dashboardu użytkownika
 */
export type DashboardStats = {
  /** Całkowita liczba fiszek użytkownika */
  totalFlashcards: number;

  /** Liczba wykonanych generacji AI */
  totalGenerations: number;

  /** Wskaźnik akceptacji fiszek AI w procentach (0-100) */
  acceptanceRate: number;

  /** Liczba fiszek oczekujących na naukę (dla MVP może być 0) */
  flashcardsDueForStudy: number;
};

/**
 * Propsy dla komponentu StatsCard
 */
export type StatsCardProps = {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  variant?: "default" | "highlight";
};

/**
 * Propsy dla komponentu MenuTile
 */
export type MenuTileProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  variant?: "default" | "primary";
};

/**
 * Profil użytkownika dla wyświetlenia w UI
 */
export type UserProfile = {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
};

/**
 * Odpowiedź z endpointu statystyk (jeśli zostanie stworzony)
 */
export type DashboardStatsResponse = {
  stats: DashboardStats;
};
```

### 5.2. Istniejące typy wykorzystywane w widoku

Z pliku `src/types.ts`:

- `FlashcardListResponse` - do pobierania liczby fiszek
- `GenerationListResponse` - do pobierania statystyk generacji
- `GenerationDTO` - do obliczeń wskaźnika akceptacji
- `PaginationMeta` - do wyciągania totali

## 6. Zarządzanie stanem

### 6.1. Custom Hook: useDashboardStats

Hook zarządzający pobieraniem i obliczaniem statystyk dashboardu.

**Lokalizacja**: `src/lib/hooks/useDashboardStats.ts` (nowy plik)

**Implementacja**:

```typescript
import { useState, useEffect } from "react";
import type { DashboardStats } from "../../types";

type UseDashboardStatsReturn = {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Równoległe wywołania API
      const [flashcardsRes, generationsRes] = await Promise.all([
        fetch("/api/flashcards?limit=1"),
        fetch("/api/generations?limit=50"), // zwiększony limit dla dokładniejszych statystyk
      ]);

      if (!flashcardsRes.ok || !generationsRes.ok) {
        throw new Error("Błąd podczas pobierania statystyk");
      }

      const flashcardsData = await flashcardsRes.json();
      const generationsData = await generationsRes.json();

      // Obliczenia statystyk
      const totalFlashcards = flashcardsData.pagination.total;
      const totalGenerations = generationsData.pagination.total;

      // Obliczanie wskaźnika akceptacji
      let acceptanceRate = 0;
      if (generationsData.data.length > 0) {
        const totalGenerated = generationsData.data.reduce((sum, gen) => sum + gen.generated_count, 0);
        const totalAccepted = generationsData.data.reduce(
          (sum, gen) => sum + (gen.accepted_unedited_count || 0) + (gen.accepted_edited_count || 0),
          0
        );
        acceptanceRate = totalGenerated > 0 ? Math.round((totalAccepted / totalGenerated) * 100) : 0;
      }

      // Fiszki do nauki - na MVP placeholder
      const flashcardsDueForStudy = 0;

      setStats({
        totalFlashcards,
        totalGenerations,
        acceptanceRate,
        flashcardsDueForStudy,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nieznany błąd"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
```

**Stan hooka**:

- `stats: DashboardStats | null` - zagregowane statystyki lub null przed załadowaniem
- `isLoading: boolean` - flaga ładowania
- `error: Error | null` - błąd jeśli wystąpił
- `refetch: () => Promise<void>` - funkcja do ponownego pobrania danych

### 6.2. Custom Hook: useAuth (jeśli nie istnieje)

Hook zarządzający stanem uwierzytelnienia użytkownika.

**Lokalizacja**: `src/lib/hooks/useAuth.ts` (nowy plik lub istniejący)

**Implementacja**:

```typescript
import { useState, useEffect } from "react";
import { supabase } from "../../db/supabase.client";
import type { UserProfile } from "../../types";

type UseAuthReturn = {
  user: UserProfile | null;
  isLoading: boolean;
  logout: () => Promise<void>;
};

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Pobranie aktualnego użytkownika
    supabase.auth.getUser().then(({ data, error }) => {
      if (data.user && !error) {
        setUser({
          id: data.user.id,
          email: data.user.email!,
          username: data.user.user_metadata?.username,
          avatar_url: data.user.user_metadata?.avatar_url,
        });
      }
      setIsLoading(false);
    });

    // Subskrypcja zmian stanu auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          username: session.user.user_metadata?.username,
          avatar_url: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return { user, isLoading, logout };
}
```

### 6.3. Zarządzanie Dark Mode

**Podejście**: Context API + localStorage

**Lokalizacja**: `src/lib/context/ThemeContext.tsx` (nowy plik)

**Implementacja**:

```typescript
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Odczyt z localStorage lub system preference
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

## 7. Integracja API

### 7.1. Pobieranie statystyk fiszek

**Endpoint**: `GET /api/flashcards?limit=1`

**Cel**: Pobranie całkowitej liczby fiszek użytkownika

**Request**: Brak body, query params: `limit=1`

**Response Type**: `FlashcardListResponse`

**Wykorzystanie**:

```typescript
const response = await fetch("/api/flashcards?limit=1");
const data: FlashcardListResponse = await response.json();
const totalFlashcards = data.pagination.total;
```

### 7.2. Pobieranie statystyk generacji

**Endpoint**: `GET /api/generations?limit=50`

**Cel**: Pobranie danych generacji dla obliczenia statystyk

**Request**: Brak body, query params: `limit=50` (zwiększony limit dla dokładniejszych obliczeń)

**Response Type**: `GenerationListResponse`

**Wykorzystanie**:

```typescript
const response = await fetch("/api/generations?limit=50");
const data: GenerationListResponse = await response.json();

const totalGenerations = data.pagination.total;

// Obliczanie wskaźnika akceptacji
const totalGenerated = data.data.reduce((sum, gen) => sum + gen.generated_count, 0);
const totalAccepted = data.data.reduce(
  (sum, gen) => sum + (gen.accepted_unedited_count || 0) + (gen.accepted_edited_count || 0),
  0
);
const acceptanceRate = totalGenerated > 0 ? Math.round((totalAccepted / totalGenerated) * 100) : 0;
```

**Uwaga**: W przypadku bardzo dużej liczby generacji (>50), wskaźnik akceptacji będzie oparty tylko na 50 najnowszych generacjach. Dla lepszej dokładności zalecane jest stworzenie dedykowanego endpointu `/api/stats`.

### 7.3. Alternatywa: Dedykowany endpoint /api/stats (rekomendowane)

**Endpoint**: `GET /api/stats` (do zaimplementowania)

**Cel**: Pobranie wszystkich zagregowanych statystyk w jednym wywołaniu

**Request**: Brak body i query params

**Response Type**: `DashboardStatsResponse`

**Response Example**:

```json
{
  "stats": {
    "totalFlashcards": 156,
    "totalGenerations": 23,
    "acceptanceRate": 82,
    "flashcardsDueForStudy": 0
  }
}
```

**Zalety**:

- Jedno wywołanie API zamiast dwóch
- Dokładniejsze obliczenia (agregacja w bazie danych)
- Lepsza wydajność
- Łatwiejsza rozbudowa o kolejne statystyki

**Implementacja endpointu** (opcjonalna, do rozważenia):

Plik: `src/pages/api/stats.ts`

```typescript
import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../db/supabase.client";
import type { DashboardStatsResponse } from "../../types";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // TODO: Pobrać user_id z locals po implementacji auth middleware
    const userId = "test-user-uuid"; // Placeholder

    const supabase = getSupabaseClient();

    // Równoległe zapytania do bazy
    const [flashcardsCount, generationsData] = await Promise.all([
      supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", userId),

      supabase
        .from("generations")
        .select("generated_count, accepted_unedited_count, accepted_edited_count")
        .eq("user_id", userId),
    ]);

    // Obliczenia
    const totalFlashcards = flashcardsCount.count ?? 0;
    const totalGenerations = generationsData.data?.length ?? 0;

    let acceptanceRate = 0;
    if (generationsData.data && generationsData.data.length > 0) {
      const totalGenerated = generationsData.data.reduce((sum, gen) => sum + gen.generated_count, 0);
      const totalAccepted = generationsData.data.reduce(
        (sum, gen) => sum + (gen.accepted_unedited_count || 0) + (gen.accepted_edited_count || 0),
        0
      );
      acceptanceRate = totalGenerated > 0 ? Math.round((totalAccepted / totalGenerated) * 100) : 0;
    }

    const response: DashboardStatsResponse = {
      stats: {
        totalFlashcards,
        totalGenerations,
        acceptanceRate,
        flashcardsDueForStudy: 0, // MVP placeholder
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Nie udało się pobrać statystyk",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### 7.4. Wylogowanie użytkownika

**Metoda**: Supabase client-side `auth.signOut()`

**Implementacja**:

```typescript
const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout error:", error);
    // Wyświetlić toast z błędem
  }
  // Przekierowanie do strony logowania
  window.location.href = "/login";
};
```

## 8. Interakcje użytkownika

### 8.1. Kliknięcie kafelka menu nawigacyjnego

**Trigger**: Click na `<MenuTile>`

**Zachowanie**:

1. Nawigacja do odpowiedniej ścieżki (href)
2. Transition effect przed nawigacją (opcjonalnie)
3. Aktywacja hover state przed kliknięciem

**Implementacja**: Link komponent z Astro lub React Router

### 8.2. Przełączenie Dark Mode

**Trigger**: Click na przycisk Dark Mode Toggle

**Zachowanie**:

1. Toggle klasy `dark` na `document.documentElement`
2. Zapis preferencji do `localStorage`
3. Zmiana ikony przycisku (Sun ↔ Moon)
4. Animacja transition (fade)

**Implementacja**: Hook `useTheme()` + onClick handler

### 8.3. Wylogowanie użytkownika

**Trigger**: Click na "Wyloguj się" w dropdown menu

**Zachowanie**:

1. Wywołanie `supabase.auth.signOut()`
2. Wyświetlenie loading indicator
3. Czyszczenie stanu aplikacji
4. Przekierowanie do `/login`
5. Wyświetlenie komunikatu "Zostałeś wylogowany" (opcjonalnie)

**Implementacja**: Async function w `useAuth()` hook

### 8.4. Ponowne załadowanie statystyk

**Trigger**: Click na przycisk "Spróbuj ponownie" (w przypadku błędu)

**Zachowanie**:

1. Wywołanie funkcji `refetch()` z hooka
2. Reset stanu błędu
3. Wyświetlenie loading state
4. Załadowanie świeżych danych

**Implementacja**: Button z onClick handler wywołującym `refetch()`

### 8.5. Keyboard Navigation

**Trigger**: Użycie klawiatury (Tab, Enter, Space)

**Zachowanie**:

- Tab: Przejście focus między kafelkami menu
- Enter/Space: Aktywacja linku
- Focus visible: Wyraźny outline/border

**Implementacja**: Natywna funkcjonalność przeglądarki + style CSS dla `:focus-visible`

### 8.6. Hover na kafelkach

**Trigger**: Najechanie myszą na `<MenuTile>`

**Zachowanie**:

1. Scale up (transform: scale(1.02))
2. Shadow increase (shadow-lg → shadow-xl)
3. Background color change (subtle)
4. Smooth transition (150-200ms)

**Implementacja**: Tailwind classes: `hover:scale-102 hover:shadow-xl transition-transform`

## 9. Warunki i walidacja

### 9.1. Warunek uwierzytelnienia (Middleware)

**Komponent**: `src/middleware/index.ts`

**Warunek**: Użytkownik musi posiadać ważny JWT token

**Walidacja**:

```typescript
// W middleware
const token = request.headers.get("cookie")?.includes("supabase-auth-token");

if (!token || !isValidToken(token)) {
  return Response.redirect(new URL("/login", request.url));
}
```

**Wpływ na UI**: Brak - jeśli walidacja nie przejdzie, użytkownik jest przekierowywany przed renderowaniem

### 9.2. Warunek dostępności danych statystyk

**Komponenty**: `StatsSection`, `StatsCard`

**Warunek**: Dane statystyk muszą być załadowane przed wyświetleniem

**Walidacja**:

```typescript
if (isLoading) {
  return <StatsSkeleton />;
}

if (error) {
  return <ErrorMessage error={error} onRetry={refetch} />;
}

if (!stats) {
  return <EmptyState />;
}

return <StatsGrid stats={stats} />;
```

**Wpływ na UI**:

- Loading → Skeleton loaders
- Error → Komunikat błędu + przycisk retry
- No data → Empty state
- Success → Pełne statystyki

### 9.3. Warunek wyświetlania avatara użytkownika

**Komponent**: `UserDropdown`

**Warunek**: Jeśli użytkownik ma `avatar_url`, wyświetl avatar, w przeciwnym razie inicjały lub domyślną ikonę

**Walidacja**:

```typescript
<Avatar>
  {user.avatar_url ? (
    <AvatarImage src={user.avatar_url} alt={user.username || user.email} />
  ) : (
    <AvatarFallback>
      {getInitials(user.username || user.email)}
    </AvatarFallback>
  )}
</Avatar>
```

**Wpływ na UI**: Wybór między obrazem a fallbackiem

### 9.4. Warunek wyświetlania wskaźnika akceptacji

**Komponent**: `StatsCard` (dla acceptance rate)

**Warunek**: Jeśli brak generacji, wyświetl "—" zamiast "0%"

**Walidacja**:

```typescript
const displayValue = stats.totalGenerations === 0 ? "—" : `${stats.acceptanceRate}%`;
```

**Wpływ na UI**: Lepsze UX - jasne komunikowanie braku danych

### 9.5. Warunek placeholder dla fiszek do nauki

**Komponent**: `StatsCard` (dla flashcards due)

**Warunek**: W MVP zawsze "Wkrótce" lub 0

**Walidacja**:

```typescript
const displayValue = "Wkrótce"; // lub stats.flashcardsDueForStudy
```

**Wpływ na UI**: Komunikowanie nadchodzącej funkcjonalności

## 10. Obsługa błędów

### 10.1. Błąd API podczas pobierania statystyk

**Scenariusz**: Endpoint `/api/flashcards` lub `/api/generations` zwraca błąd (4xx, 5xx)

**Obsługa**:

1. Złapanie błędu w try-catch w `useDashboardStats`
2. Ustawienie `error` state
3. Wyświetlenie komunikatu: "Nie udało się załadować statystyk"
4. Przycisk "Spróbuj ponownie" wywołujący `refetch()`
5. Opcjonalnie: Wyświetlenie fallback values (0) zamiast pełnego błędu

**Implementacja**:

```typescript
// W komponencie StatsSection
if (error) {
  return (
    <div className="text-center py-8">
      <p className="text-destructive mb-4">
        Nie udało się załadować statystyk
      </p>
      <Button onClick={onRetry} variant="outline">
        Spróbuj ponownie
      </Button>
    </div>
  );
}
```

### 10.2. Network error (brak połączenia)

**Scenariusz**: Użytkownik nie ma połączenia z internetem

**Obsługa**:

1. Catch error z komunikatem network-specific
2. Wyświetlenie komunikatu: "Sprawdź połączenie z internetem"
3. Auto-retry po wykryciu reconnect (opcjonalnie)

**Implementacja**:

```typescript
catch (error) {
  const message = error instanceof TypeError && error.message.includes('fetch')
    ? 'Sprawdź połączenie z internetem'
    : 'Wystąpił nieoczekiwany błąd';

  setError(new Error(message));
}
```

### 10.3. Błąd wylogowania

**Scenariusz**: Supabase `auth.signOut()` zwraca błąd

**Obsługa**:

1. Log error do konsoli
2. Wyświetlenie toast notification: "Nie udało się wylogować. Spróbuj ponownie."
3. Nie blokowanie UI - użytkownik może spróbować ponownie

**Implementacja**:

```typescript
const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = "/login";
  } catch (error) {
    console.error("Logout error:", error);
    toast.error("Nie udało się wylogować. Spróbuj ponownie.");
  }
};
```

### 10.4. Partial data load

**Scenariusz**: Jedno API call się powiodło, drugie nie

**Obsługa**:

1. Wyświetlić dane które są dostępne
2. Dla brakujących danych pokazać placeholder ("—") lub skeleton
3. Opcjonalnie: Komunikat "Niektóre statystyki są niedostępne"

**Implementacja**:

```typescript
const fetchStats = async () => {
  let flashcardsTotal = 0;
  let generationsTotal = 0;
  let acceptanceRate = 0;

  try {
    const flashcardsRes = await fetch("/api/flashcards?limit=1");
    if (flashcardsRes.ok) {
      const data = await flashcardsRes.json();
      flashcardsTotal = data.pagination.total;
    }
  } catch (err) {
    console.error("Failed to fetch flashcards:", err);
  }

  try {
    const generationsRes = await fetch("/api/generations?limit=50");
    if (generationsRes.ok) {
      const data = await generationsRes.json();
      generationsTotal = data.pagination.total;
      // ... obliczenia acceptanceRate
    }
  } catch (err) {
    console.error("Failed to fetch generations:", err);
  }

  // Ustawienie stats z dostępnymi danymi
  setStats({
    totalFlashcards: flashcardsTotal,
    totalGenerations: generationsTotal,
    acceptanceRate,
    flashcardsDueForStudy: 0,
  });
};
```

### 10.5. Token wygasł podczas korzystania z dashboardu

**Scenariusz**: JWT token wygasł podczas przeglądania dashboardu

**Obsługa**:

1. API zwraca 401 Unauthorized
2. Wykrycie w interceptorze lub error handlerze
3. Redirect do `/login` z parametrem `?redirect=/dashboard`
4. Toast: "Twoja sesja wygasła. Zaloguj się ponownie."

**Implementacja**:

```typescript
// Global error handler lub w fetch wrapper
if (response.status === 401) {
  window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
}
```

### 10.6. Błąd renderowania komponentu (React Error Boundary)

**Scenariusz**: Nieoczekiwany błąd w komponencie React

**Obsługa**:

1. Error Boundary otaczający `<DashboardContent>`
2. Wyświetlenie fallback UI
3. Log błędu do konsoli (lub external service)
4. Przycisk "Odśwież stronę"

**Implementacja**:

```typescript
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">
            Coś poszło nie tak
          </h2>
          <Button onClick={() => window.location.reload()}>
            Odśwież stronę
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików i typów

1.1. Utworzenie nowych typów w `src/types.ts`:

- `DashboardStats`
- `StatsCardProps`
- `MenuTileProps`
- `UserProfile`
- `DashboardStatsResponse`

1.2. Utworzenie struktury folderów dla komponentów:

```
src/components/dashboard/
├── DashboardContent.tsx
├── DashboardHeader.tsx
├── WelcomeSection.tsx
├── StatsSection.tsx
├── StatsGrid.tsx
├── StatsCard.tsx
├── StatsSkeleton.tsx
├── NavigationSection.tsx
├── MenuGrid.tsx
└── MenuTile.tsx
```

1.3. Utworzenie struktury folderów dla hooków:

```
src/lib/hooks/
├── useDashboardStats.ts
├── useAuth.ts (jeśli nie istnieje)
└── index.ts (re-export)
```

1.4. Utworzenie kontekstu dla theme:

```
src/lib/context/
└── ThemeContext.tsx
```

### Krok 2: Implementacja custom hooków

2.1. Implementacja `useAuth` hook:

- Pobieranie danych użytkownika z Supabase
- Subskrypcja zmian auth state
- Funkcja `logout()`
- Return: `{ user, isLoading, logout }`

2.2. Implementacja `useDashboardStats` hook:

- Fetch danych z `/api/flashcards?limit=1`
- Fetch danych z `/api/generations?limit=50`
- Obliczanie acceptanceRate
- Funkcja `refetch()`
- Error handling
- Return: `{ stats, isLoading, error, refetch }`

2.3. Implementacja `ThemeContext` i `useTheme` hook:

- State dla theme ('light' | 'dark')
- Odczyt z localStorage
- System preference detection
- Toggle funkcja z persist do localStorage
- Manipulacja klasą 'dark' na document.documentElement

### Krok 3: Implementacja komponentów prezentacyjnych (od liści do korzenia)

3.1. `StatsCard`:

- Props: icon, value, label, variant
- Struktura: Card > CardHeader (icon) + CardContent (value + label)
- Tailwind styling z responsywnością
- ARIA attributes

3.2. `StatsCardSkeleton`:

- Skeleton components dla ikony, wartości i labela
- Identyczne wymiary jak StatsCard

3.3. `StatsSkeleton`:

- Grid container
- 4× StatsCardSkeleton

3.4. `StatsGrid`:

- Props: stats
- Grid layout (responsive: 1 col mobile, 2 cols tablet, 4 cols desktop)
- Mapping stats do 4× StatsCard z odpowiednimi propsami

3.5. `StatsSection`:

- Props: stats, isLoading, error, onRetry
- Conditional rendering:
  - Loading → StatsSkeleton
  - Error → Error message + retry button
  - Success → StatsGrid

3.6. `MenuTile`:

- Props: icon, title, description, href, variant
- Link wrapper
- Card z hover effects (scale, shadow)
- Focus-visible styles
- Semantic HTML

3.7. `MenuGrid`:

- Props: tiles (array)
- Nav wrapper z ARIA label
- Grid layout 2×2 (1 col mobile)
- Mapping tiles do MenuTile

3.8. `NavigationSection`:

- Section wrapper
- Optional heading
- MenuGrid z hardcoded tiles data

3.9. `WelcomeSection`:

- Props: user
- Heading z "Witaj, {username || email}!"
- Stylowanie

3.10. `DashboardHeader`:

- Props: user, onLogout
- Header semantic element
- Logo (link do /dashboard)
- Dark mode toggle button (useTheme hook)
- User dropdown (shadcn/ui DropdownMenu)
  - Avatar with fallback
  - Email (disabled item)
  - Separator
  - Logout item

### Krok 4: Implementacja głównego komponentu Dashboard

4.1. `DashboardContent`:

- Props: initialUser (optional)
- Użycie hooków: useAuth, useDashboardStats, useTheme
- Conditional rendering dla loading state auth
- Layout struktura:
  - DashboardHeader
  - Container div
    - WelcomeSection
    - StatsSection
    - NavigationSection
- Error boundary wrapper (opcjonalnie)

### Krok 5: Implementacja Astro page

5.1. `src/pages/dashboard.astro`:

- Import Layout
- Server-side: Sprawdzenie auth (może być w middleware)
- Import DashboardContent
- Render:

  ```astro
  ---
  import Layout from "../layouts/Layout.astro";
  import DashboardContent from "../components/dashboard/DashboardContent";
  // TODO: Pobieranie user z middleware po implementacji auth
  ---

  <Layout title="Dashboard - 10x cards">
    <DashboardContent client:load />
  </Layout>
  ```

### Krok 6: Konfiguracja middleware (jeśli nie istnieje)

6.1. Update `src/middleware/index.ts`:

- Sprawdzanie JWT tokenu dla ścieżek `/dashboard`, `/flashcards`, `/generate`, etc.
- Redirect do `/login` jeśli brak tokenu
- Dodanie user info do `locals` dla dostępu w Astro pages

### Krok 7: Styling i responsywność

7.1. Tailwind configuration:

- Weryfikacja dark mode config: `darkMode: 'class'`
- Custom colors jeśli potrzebne
- Custom breakpoints jeśli potrzebne

7.2. Global styles dla transitions:

- Smooth color transitions dla dark mode
- Hover transitions dla interactive elements

7.3. Responsywność:

- Mobile first approach
- Breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- Grid adjustments per breakpoint

### Krok 8: Integracja API

8.1. Testowanie istniejących endpointów:

- `GET /api/flashcards?limit=1`
- `GET /api/generations?limit=50`

8.2. (Opcjonalnie) Implementacja dedykowanego endpointu:

- `src/pages/api/stats.ts`
- Agregacja statystyk w jednym zapytaniu
- Update `useDashboardStats` do użycia nowego endpointu

### Krok 9: Accessibility

9.1. ARIA labels:

- Navigation landmark z descriptive label
- Stats cards z role="status" i aria-label
- Buttons z descriptive aria-labels

9.2. Keyboard navigation:

- Wszystkie interactive elements focusable
- Visible focus indicators
- Logical tab order

9.3. Screen reader testing:

- Proper heading hierarchy (h1 > h2 > h3)
- Descriptive link texts
- Image alt texts (dla ikon używać aria-hidden="true" + text label)

### Krok 10: Testowanie i optymalizacja

10.1. Testing scenariuszy:

- Logowanie i dostęp do dashboard
- Loading states
- Error states (symulacja błędów API)
- Dark mode toggle
- Logout flow
- Nawigacja przez kafelki
- Responsywność na różnych urządzeniach
- Keyboard navigation

10.2. Performance optimization:

- Lazy loading komponentów jeśli potrzebne
- Memoization (React.memo) dla expensive components
- Image optimization (jeśli są grafiki)
- Bundle size check

10.3. Error handling verification:

- Wszystkie try-catch blocks działają poprawnie
- Error messages są user-friendly
- Retry mechanizmy działają

### Krok 11: Dokumentacja i finalizacja

11.1. Code comments:

- JSDoc dla komponentów
- Comments dla complex logic

11.2. README update (jeśli potrzebne):

- Dokumentacja dashboard features
- Instrukcje użycia hooków

11.3. Type exports:

- Export wszystkich nowych typów z `src/types.ts`
- Verify type safety w całym flow

11.4. Git commit:

- Commit z opisem: "feat: implement dashboard view with stats and navigation"

---

## Dodatkowe uwagi implementacyjne

### Kolejność implementacji elementów statystyk

Dane dla 4 kart statystyk:

1. **Całkowita liczba fiszek**:
   - Źródło: `GET /api/flashcards?limit=1` → `pagination.total`
   - Ikona: `BookOpen` (lucide-react)
   - Label: "Wszystkie fiszki"

2. **Liczba generacji AI**:
   - Źródło: `GET /api/generations?limit=1` → `pagination.total`
   - Ikona: `Sparkles` (lucide-react)
   - Label: "Generacje AI"

3. **Wskaźnik akceptacji**:
   - Źródło: Obliczenia z `GET /api/generations` → suma accepted / suma generated × 100%
   - Ikona: `TrendingUp` (lucide-react)
   - Label: "Wskaźnik akceptacji"
   - Format: "{value}%"

4. **Fiszki do nauki**:
   - Źródło: MVP placeholder - 0 lub "Wkrótce"
   - Ikona: `Calendar` (lucide-react)
   - Label: "Do nauki dzisiaj"

### Kolejność implementacji kafelków menu

Dane dla 4 kafelków nawigacyjnych (grid 2×2):

1. **Generuj fiszki** (top-left):
   - Href: `/generate`
   - Ikona: `Wand2` (lucide-react)
   - Tytuł: "Generuj fiszki"
   - Opis: "Stwórz fiszki z tekstu przy pomocy AI"
   - Variant: `primary` (wyróżniony)

2. **Moje fiszki** (top-right):
   - Href: `/flashcards`
   - Ikona: `Library` (lucide-react)
   - Tytuł: "Moje fiszki"
   - Opis: "Przeglądaj i zarządzaj swoimi fiszkami"
   - Variant: `default`

3. **Sesja nauki** (bottom-left):
   - Href: `/study`
   - Ikona: `GraduationCap` (lucide-react)
   - Tytuł: "Sesja nauki"
   - Opis: "Rozpocznij naukę z algorytmem powtórek"
   - Variant: `default`

4. **Historia generacji** (bottom-right):
   - Href: `/generations`
   - Ikona: `History` (lucide-react)
   - Tytuł: "Historia generacji"
   - Opis: "Zobacz historię generowania fiszek"
   - Variant: `default`

### Sugerowane kolory i stylowanie (Tailwind)

**StatsCard**:

- Border: `border border-border`
- Background: `bg-card`
- Padding: `p-6`
- Rounded: `rounded-lg`
- Shadow: `shadow-sm`
- Icon container: `p-3 rounded-full bg-primary/10`
- Icon color: `text-primary`
- Value: `text-3xl font-bold`
- Label: `text-sm text-muted-foreground`

**MenuTile**:

- Border: `border-2 border-border`
- Background: `bg-card`
- Padding: `p-6`
- Rounded: `rounded-xl`
- Shadow: `shadow-md`
- Hover: `hover:shadow-xl hover:scale-[1.02] hover:border-primary/50`
- Transition: `transition-all duration-200`
- Icon container: `p-4 rounded-lg bg-primary/10`
- Icon size: `w-10 h-10 text-primary`
- Title: `text-xl font-semibold`
- Description: `text-sm text-muted-foreground`

**Primary variant (Generuj fiszki)**:

- Border: `border-primary`
- Background: `bg-primary/5`
- Icon container: `bg-primary/20`

### Przykładowe wymiary i spacing

**Dashboard layout**:

- Container max-width: `max-w-7xl mx-auto`
- Padding: `px-4 sm:px-6 lg:px-8 py-8`
- Gap między sekcjami: `space-y-8` lub `gap-8`

**StatsGrid**:

- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6`

**MenuGrid**:

- Grid: `grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6`

**Header**:

- Height: `h-16`
- Padding: `px-4 md:px-6`
- Border bottom: `border-b border-border`

---

Ten plan implementacji dostarcza wszystkich niezbędnych informacji do pełnego wdrożenia widoku Dashboard zgodnie z wymogami PRD i dostarczonym stosem technologicznym.
