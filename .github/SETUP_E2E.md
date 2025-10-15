# Konfiguracja testów E2E w GitHub Actions

## Wymagane GitHub Secrets

Aby testy E2E działały w CI/CD, musisz skonfigurować następujące secrets w repozytorium GitHub:

### 1. Supabase
- `PUBLIC_SUPABASE_URL` - URL twojej instancji Supabase (np. `https://xxxxx.supabase.co`)
- `PUBLIC_SUPABASE_ANON_KEY` - Publiczny klucz Supabase anon key

### 2. Użytkownik testowy E2E
- `E2E_USERNAME` - Email użytkownika testowego (np. `e2e-test@example.com`)
- `E2E_PASSWORD` - Hasło użytkownika testowego

## Jak dodać secrets?

1. Przejdź do swojego repozytorium na GitHub
2. Kliknij `Settings` → `Secrets and variables` → `Actions`
3. Kliknij `New repository secret`
4. Dodaj każdy z wymaganych secrets

## Użytkownik testowy

**WAŻNE:** Musisz utworzyć użytkownika testowego w Supabase:

1. Przejdź do Supabase Dashboard → Authentication → Users
2. Dodaj nowego użytkownika z emailem i hasłem zgodnym z secrets
3. Ten użytkownik będzie używany do testów E2E

## Sprawdzanie testów

Po skonfigurowaniu secrets:
1. Utwórz Pull Request do brancha `master`
2. GitHub Actions automatycznie uruchomi wszystkie testy, w tym E2E
3. Wyniki testów znajdziesz w zakładce `Actions`
4. W przypadku błędów możesz pobrać artefakty:
   - `playwright-report` - raport HTML z Playwright
   - `test-results` - screenshoty i traces z nieudanych testów

## Lokalne testy E2E

Aby uruchomić testy lokalnie:

1. Skopiuj `.env.example` do `.env.test`
2. Wypełnij zmienne środowiskowe
3. Uruchom testy:

```bash
npm run e2e
```

## Struktura testów

Testy E2E znajdują się w folderze `e2e/`:
- `auth.spec.ts` - testy autoryzacji
- `flashcards.spec.ts` - testy zarządzania fiszkami (5 testów)
- `home.spec.ts` - testy strony głównej
- `study.spec.ts` - testy sesji nauki

## Konfiguracja Playwright

Konfiguracja znajduje się w `playwright.config.ts`:
- Automatyczne uruchamianie dev servera (`webServer`)
- Retry w CI: 2 próby
- Artifacts: trace, screenshot, video (tylko przy błędach)
- Timeout: 30s na test
- Viewport: 1366x768 (Desktop)

