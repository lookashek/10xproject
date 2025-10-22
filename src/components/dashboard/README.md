# Dashboard Components

Komponenty dla widoku Dashboard aplikacji 10x-cards.

## Struktura komponentów

### DashboardContent

Główny kontainer dla całego dashboardu. Komponent typu "island" renderowany po stronie klienta (`client:load`).

**Features:**

- Zarządzanie stanem użytkownika (useAuth)
- Pobieranie statystyk (useDashboardStats)
- Zarządzanie dark mode (ThemeContext)
- Skip link dla accessibility
- Loading states i error handling

**Props:**

- `initialUser?: UserProfile` - Dane użytkownika przekazane z Astro

### DashboardHeader

Sticky header zawierający logo, dark mode toggle i menu użytkownika.

**Features:**

- Logo z linkiem do /dashboard
- Dark mode toggle (Moon/Sun icon)
- User dropdown z avatarem
- Logout funkcjonalność
- Responsive design

**Props:**

- `user: UserProfile` - Dane zalogowanego użytkownika
- `onLogout: () => Promise<void>` - Callback dla wylogowania

### WelcomeSection

Sekcja powitalna z personalizowanym powitaniem użytkownika.

**Props:**

- `user: UserProfile` - Dane użytkownika

### StatsSection

Sekcja zawierająca 4 karty statystyk z obsługą loading/error/empty states.

**Features:**

- Conditional rendering (loading/error/success)
- ARIA labels dla accessibility
- Przycisk retry przy błędzie
- Responsive grid layout

**Props:**

- `stats: DashboardStats | null` - Statystyki użytkownika
- `isLoading: boolean` - Stan ładowania
- `error: Error | null` - Błąd jeśli wystąpił
- `onRetry?: () => void` - Callback dla retry

### StatsGrid

Grid 4 kart statystyk (responsywny: 1 col mobile, 2 cols tablet, 4 cols desktop).

**Props:**

- `stats: DashboardStats` - Statystyki do wyświetlenia

### StatsCard

Pojedyncza karta statystyk z ikoną, wartością i labelką.

**Features:**

- Hover effects
- ARIA role="status" dla screen readers
- Responsive typography
- Tabular nums dla liczb

**Props:**

- `icon: React.ReactNode` - Ikona (lucide-react)
- `value: number | string` - Wartość statystyki
- `label: string` - Opis statystyki
- `variant?: 'default' | 'highlight'` - Wariant wizualny

### StatsCardSkeleton / StatsSkeleton

Skeleton loaders dla loading state statystyk.

### NavigationSection

Sekcja zawierająca główne menu nawigacyjne (4 kafelki).

### MenuGrid

Grid 2×2 z kafelkami nawigacyjnymi (1 col na mobile).

**Features:**

- Semantic `<nav>` element
- ARIA label "Główna nawigacja"

### MenuTile

Duży, klikalny kafelek prowadzący do jednej z funkcji aplikacji.

**Features:**

- Hover effects (scale, shadow, background)
- Active state (scale down)
- Focus visible states
- Group hover dla ikony
- ARIA labels

**Props:**

- `icon: React.ReactNode` - Ikona (lucide-react)
- `title: string` - Tytuł funkcji
- `description: string` - Krótki opis
- `href: string` - Ścieżka docelowa
- `variant?: 'default' | 'primary'` - Wariant (primary = wyróżniony)

## Custom Hooks

### useAuth

Hook zarządzający stanem uwierzytelnienia użytkownika.

**Returns:**

- `user: UserProfile | null` - Dane użytkownika
- `isLoading: boolean` - Stan ładowania
- `logout: () => Promise<void>` - Funkcja wylogowania

### useDashboardStats

Hook pobierający i obliczający statystyki dashboardu.

**Returns:**

- `stats: DashboardStats | null` - Zagregowane statystyki
- `isLoading: boolean` - Stan ładowania
- `error: Error | null` - Błąd jeśli wystąpił
- `refetch: () => Promise<void>` - Funkcja do ponownego pobrania

**API Calls:**

- `GET /api/flashcards?limit=1` - Pobiera total liczby fiszek
- `GET /api/generations?limit=50` - Pobiera dane generacji dla obliczeń

**Obliczenia:**

- `totalFlashcards` - z pagination.total
- `totalGenerations` - z pagination.total
- `acceptanceRate` - (suma accepted / suma generated) × 100%
- `flashcardsDueForStudy` - MVP placeholder (0 lub "Wkrótce")

### useTheme (ThemeContext)

Context API dla zarządzania dark mode.

**Returns:**

- `theme: 'light' | 'dark'` - Aktualny motyw
- `toggleTheme: () => void` - Funkcja przełączania

**Features:**

- Zapis w localStorage
- System preference detection
- Smooth transitions

## Accessibility Features

- ✅ Skip link dla keyboard navigation
- ✅ ARIA labels na wszystkich interaktywnych elementach
- ✅ ARIA live regions dla dynamicznych treści
- ✅ ARIA busy states dla loading
- ✅ Semantic HTML (nav, section, main)
- ✅ Focus visible states
- ✅ Keyboard navigation (Tab, Enter, Space)
- ✅ Screen reader compatible
- ✅ role="status" dla statystyk

## Responsive Design

### Breakpoints

- Mobile: < 768px (sm)
- Tablet: 768px - 1024px (md)
- Desktop: > 1024px (lg)

### Grid Layouts

- **StatsGrid**: 1 → 2 → 4 columns
- **MenuGrid**: 1 → 2 columns
- **Spacing**: Zmniejszone padding/gap na mobile

### Typography

- Heading scales: text-2xl → text-3xl → text-4xl
- Logo scales: text-lg → text-xl

## Styling

### Tailwind Classes

- Dark mode: `dark:` variant
- Transitions: 150-200ms duration
- Hover: scale, shadow, background changes
- Focus: ring-2, ring-offset-2

### Color Scheme

- Primary actions: border-primary, bg-primary/10
- Cards: bg-card, border-border
- Text: text-foreground, text-muted-foreground

## Usage Example

```astro
---
// src/pages/dashboard.astro
import Layout from "../layouts/Layout.astro";
import { DashboardContent } from "../components/dashboard/DashboardContent";

const user = Astro.locals.user;
---

<Layout title="Dashboard - 10x cards">
  <DashboardContent client:load initialUser={user} />
</Layout>
```

## Data Flow

1. **Server**: Middleware sprawdza auth → dodaje user do locals
2. **Astro Page**: Przekazuje initialUser do DashboardContent
3. **DashboardContent**:
   - Subskrybuje auth state (useAuth)
   - Pobiera statystyki (useDashboardStats)
   - Renderuje komponenty
4. **Components**: Prezentują dane i obsługują interakcje

## Error Handling

- Network errors: "Sprawdź połączenie z internetem"
- API errors: "Nie udało się załadować statystyk" + retry button
- Empty state: "Brak danych do wyświetlenia"
- Loading state: Skeleton loaders z aria-busy

## Performance

- Lazy loading: DashboardContent z client:load
- Memoization: React.memo dla expensive components (opcjonalnie)
- Bundle splitting: Astro automatic code splitting
- Parallel API calls: Promise.all dla flashcards i generations

## Testing Checklist

- [ ] Login flow → redirect do /dashboard
- [ ] Logout flow → redirect do /login
- [ ] Stats loading state
- [ ] Stats error state + retry
- [ ] Dark mode toggle
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Hover states
- [ ] Focus states
- [ ] API integration
