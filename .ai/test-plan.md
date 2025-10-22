Plan testów dla projektu 10x-cards (Astro 5, React 19, TypeScript 5, Tailwind 4, shadcn/ui, Supabase, OpenRouter)

1. Wprowadzenie i cele testowania
   Cel główny: zapewnić wysoką jakość aplikacji do generowania i nauki fiszek, ze szczególnym naciskiem na niezawodność API, poprawność walidacji i bezpieczeństwo danych użytkownika.
   Zakres jakości: poprawność funkcjonalna (CRUD fiszek, generowanie AI, sesja nauki SM-2), bezpieczeństwo (auth, nagłówki, XSS), wydajność (budżety czasowe API), UX (formularze, błędy), dostępność.
   Metryki:
   Stabilność: 0 defektów P0/P1 w krytycznych ścieżkach.
   Pokrycie: >= 80% linii/gałęzi w warstwie src/lib/** i src/pages/api/**.
   Wydajność: P95 < 300 ms dla większości endpointów (z wyłączeniem POST /api/generations), timeout LLM < 60 s.
   Bezpieczeństwo: brak regresji w nagłówkach bezpieczeństwa i brak XSS na polach fiszek.
2. Zakres testów
   Warstwa API: src/pages/api/**
   Auth (/api/auth/login, /api/auth/logout)
   Fiszki: GET/POST /api/flashcards, GET/PUT/DELETE /api/flashcards/[id]
   Generacje: GET/POST /api/generations, GET /api/generations/[id]
   Middleware: src/middleware/index.ts (ochrona tras, locals.supabase, locals.user, redirecty)
   Walidacja: src/lib/validation/_.ts (Zod – fiszki i generacje)
   Logika domenowa/serwisy:
   LLM i OpenRouter: src/lib/services/llmService.ts, src/lib/openrouter.service.ts
   Hashing: src/lib/services/hashService.ts
   Błędy/kontrakty odpowiedzi: src/lib/utils/errors.ts
   Algorytm nauki: src/lib/algorithms/sm2.ts, src/lib/hooks/useStudySession.ts
   UI/UX: kluczowe widoki i komponenty: src/pages/_.astro, src/components/** (formularze, listy, dialogi)
   Poza zakresem: infrastruktura hostingowa (DO App Platform), szczegółowe testy wizualne piksel‑po‑piksel (opcjonalne snapshoty).
3. Typy testów
   Testy jednostkowe (Vitest):
   Zod schematy: flashcard.schemas.ts, generation.schemas.ts (graniczne długości, puste wartości, typy).
   errors.ts: kody/nagłówki/format JSON.
   sm2.ts: deterministyczne przypadki dla quality 0–3, clamp E-Factor, daty i sortowanie priorytetu.
   openrouter.service.ts: budowa żądania, timeout, mapowanie błędów (mock fetch/MSW).
   llmService.ts: wymuszona walidacja odpowiedzi po JSON Schema, konwersja błędów.
   hashService.ts: stabilność SHA256, kolizje (zestawy testowe).
   Testy integracyjne API (Vitest + supertest/undici):
   Endpointy src/pages/api/\*\* z uruchomionym serwerem testowym; mock Supabase (lub dedykowana instancja testowa) i MSW dla OpenRouter.
   Sprawdzenie statusów, body i nagłówków bezpieczeństwa (z errors.ts).
   Ścieżki błędów: 400/401/404/409/422/500/503.
   Testy kontraktowe (Zod jako kontrakt):
   Snapshoty schematów odpowiedzi i walidacja struktury (stabilność kontraktów API).
   E2E (Playwright):
   Kluczowe ścieżki użytkownika: logowanie, generowanie, akceptacja, CRUD fiszek, sesja nauki.
   Ochrona tras: redirecty dla niezalogowanych.
   Dostępność (axe) na głównych widokach.
   Testy bezpieczeństwa:
   Nagłówki bezpieczeństwa na odpowiedziach JSON (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection).
   Próby XSS w front/back (wstrzyknięcia HTML/JS) – oczekiwane czyszczenie/escapowanie i brak egzekucji.
   Autoryzacja: brak dostępu do zasobów bez locals.user.
   Testy wydajnościowe (kierunkowe):
   P50/P95 dla GET /api/flashcards, GET /api/generations (lista) < 300 ms w lokalnym/stage.
   POST /api/generations: poprawne zakończenie < 60 s (timeout LLM), sensowne komunikaty błędów 503/timeout.
   Testy regresji i smoke:
   Zestaw P0 dla każdego release.
4. Scenariusze testowe dla kluczowych funkcjonalności
   Middleware src/middleware/index.ts
   Niezalogowany na stronę chronioną (/dashboard, /flashcards, /generate, /study) → redirect do /login?redirect={orazgin}.
   Zalogowany na /login lub /register → redirect do /dashboard.
   locals.supabase i locals.user są ustawiane; brak sesji → brak locals.user.
   Auth API
   POST /api/auth/login: poprawne dane → 200 i sesja; złe dane → 401; walidacja braków → 422/400.
   POST /api/auth/logout: usuwa sesję; kolejne requesty API chronione → 401.
   Flashcards API
   GET /api/flashcards: paginacja, filtry source, search, 401 bez locals.user, nagłówki bezpieczeństwa.
   POST /api/flashcards:
   Single: poprawny payload → 201; duplikat (identyczne front+back) → 409; pola spoza limitów → 422/400.
   Batch: 1–50 elementów, mieszane source (ai-full/ai-edited), generation_id opcjonalny.
   GET /api/flashcards/[id]: istniejąca fiszka użytkownika → 200; cudzy zasób/brak → 404; bez auth → 401.
   PUT /api/flashcards/[id]: co najmniej jedno z front/back; zmiana source na ai-edited jeśli edytowano ai-full.
   DELETE /api/flashcards/[id]: 204; brak uprawnień/nie istnieje → 404/401.
   Generations API
   POST /api/generations: source_text 1000–10000; walidacja 422 poza zakresem; powtórzenie tekstu (hash duplikatu) → 409; błędy OpenRouter → 503/timeout.
   GET /api/generations: lista z paginacją; 401 dla niezalogowanych.
   GET /api/generations/[id]: 200 gdy istnieje i należy do użytkownika; 404/401 w przeciwnym razie.
   LLM i OpenRouter (llmService.ts, openrouter.service.ts)
   Poprawny JSON LLM zgodny z proposedFlashcardsArraySchema → mapowanie na ProposedFlashcard[] z source: 'ai-full'.
   Błędy sieci/timeouts → LLMServiceError z mapowaniem na 503.
   Wymuszona niepoprawna odpowiedź (nie-JSON/niezgodna ze schematem) → błąd walidacji (422/500).
   Algorytm SM-2 (sm2.ts, useStudySession.ts)
   initializeCard – wartości startowe.
   review – przypadki dla quality 0–3, reset/bonifikata, clamp E-Factor, poprawny next_review.
   isDue – poprawność względem aktualnego czasu.
   sortByPriority – due → nowe → reszta; deterministyczność.
   useStudySession – przejścia stanów (initializing → active → completed), zapis do localStorage, licznik statystyk.
   UI/UX (React 19 + shadcn/ui)
   Formularze (React Hook Form + Zod) – inline błędy, limity znaków, disabled/aria‑live (dla dostępności).
   Generowanie: loader, obsługa 409/422/503 z czytelnymi komunikatami.
   Flashcards list: CRUD z dialogami, potwierdzenie usunięcia, odświeżanie listy po edycji.
   Study: flip, oceny (again/hard/good/easy), kolejka, zakończenie sesji.
5. Środowisko testowe
   Lokalne:
   Node 20+, pnpm/npm wg package.json.
   Zmienne środowiskowe: SUPABASE*URL, SUPABASE_KEY (lub PUBLIC*\*), OPENROUTER_API_KEY (testowe – w testach mock).
   Supabase: osobna instancja testowa lub supabase start + migracje z supabase/migrations/\*\*; użytkownik testowy z migracji 20251006180100_create_test_user.sql.
   Build/test: npm run lint, npm run build, vitest, Playwright headless.
   Stage/Preview:
   Te same migracje, osobne klucze, wyłączone realne wywołania OpenRouter dla E2E (tryb mock/feature flag).
   Dane testowe:
   Seed minimalny zestaw fiszek i generacji per użytkownik; cleanup po testach (transakcje/fixture teardown).
   Uwaga: W MVP RLS wyłączone – testy muszą agresywnie sprawdzać filtrowanie po user_id w serwisach.
6. Narzędzia do testowania
   Jednostkowe/integracyjne: Vitest, @testing-library/react (UI), MSW (mock fetch/OpenRouter), supertest/undici do API.
   E2E: Playwright (tryby headed/headless, trace, video), axe-core/@axe-core/playwright dla dostępności.
   Jakość kodu: ESLint, Prettier, Husky + lint-staged (wg package.json).
   Raportowanie: JUnit/HTML reporters (Vitest/Playwright), integracja w CI (GitHub Actions).
   Analiza pokrycia: vitest --coverage.
7. Harmonogram testów
   Tydzień 1:
   D1–D2: przygotowanie środowiska testowego, seedy, mocki MSW dla OpenRouter.
   D3–D4: testy jednostkowe (Zod, errors, hash, SM-2, OpenRouter/LLM).
   D5: integracyjne API (flashcards/generations/auth).
   Tydzień 2:
   D1–D2: E2E dla ścieżek P0 (auth, generate→accept, CRUD, study).
   D3: wydajność, dostępność, bezpieczeństwo (nagłówki, XSS).
   D4: regresja/smoke, stabilizacja, flake‑hunting.
   D5: sign‑off, raport jakości.
8. Kryteria akceptacji testów
   100% zaliczonych testów smoke/regresji P0.
   Brak defektów P0/P1 otwartych na release.
   Pokrycie kodu min. 80% (lib + API).
   Budżety wydajności: P95 < 300 ms (lista/get), brak timeoutów poza POST /api/generations (kontrolowany).
   Wszystkie odpowiedzi API zawierają nagłówki bezpieczeństwa z src/lib/utils/errors.ts.
   Brak możliwego XSS po wprowadzeniu tekstów w front/back.
9. Role i odpowiedzialności
   QA: planowanie, projektowanie przypadków, automatyzacja (unit/integration/E2E), raporty jakości, triage.
   Dev: wsparcie mocków, poprawki defektów, utrzymanie testów jednostkowych modułów, logi diagnostyczne.
   Tech Lead: priorytetyzacja defektów, decyzje o release/scope.
   DevOps: konfiguracja CI (GH Actions), sekrety, środowiska stage/preview.
10. Procedury raportowania błędów
    Kanał: GitHub Issues.
    Template zgłoszenia:
    Tytuł, środowisko, kroki reprodukcji, oczekiwany vs. rzeczywisty rezultat, logi/konsola/trace, zrzuty ekranu/filmy, severity/priority, commit/branch.
    Severity:
    P0: brak obejścia, krytyczne ścieżki (auth, zapis fiszek, utrata danych).
    P1: poważne błędy funkcjonalne z obejściem.
    P2: problemy UX/niekrytyczne błędy.
    SLA napraw:
    P0: natychmiast (hotfix).
    P1: do najbliższego release.
    P2: wg priorytetów produktu.
    Weryfikacja: każdy fix z testem automatycznym zapobiegającym regresji, link do PR i scenariusza.
    Załącznik: mapowanie testów na artefakty kodu (orientacyjne)
    Middleware: src/middleware/index.ts
    API: src/pages/api/**
    Walidacja: src/lib/validation/flashcard.schemas.ts, src/lib/validation/generation.schemas.ts
    Błędy: src/lib/utils/errors.ts
    LLM/AI: src/lib/services/llmService.ts, src/lib/openrouter.service.ts
    Algorytm: src/lib/algorithms/sm2.ts, src/lib/hooks/useStudySession.ts
    DB/Supabase: src/db/supabase.client.ts, migracje supabase/migrations/**
    UI: src/components/\*_, strony src/pages/_.astro
    Ryzyka uwzględnione w planie: wyłączone RLS (testy autoryzacji i filtrowania po user_id), zależność od zewnętrznego LLM (mock/timeout/retry), walidacja danych użytkownika (XSS), stabilność sesji i redirectów w middleware.
