# 🔧 Konfiguracja GitHub Actions - Instrukcja

## Wymagane zmienne środowiskowe dla testów E2E

Aby testy E2E działały poprawnie w GitHub Actions, musisz ustawić następujące sekrety w repozytorium.

### 📍 Gdzie ustawić zmienne?

1. Przejdź do swojego repozytorium na GitHub
2. Kliknij **Settings** (Ustawienia)
3. W lewym menu wybierz **Secrets and variables** → **Actions**
4. Kliknij **New repository secret**

### 🔑 Wymagane sekrety

Musisz dodać następujące sekrety:

#### 1. `PUBLIC_SUPABASE_URL`

- **Nazwa:** `PUBLIC_SUPABASE_URL`
- **Wartość:** URL twojego projektu Supabase (np. `https://xxxxx.supabase.co`)
- **Typ:** Secret (zalecane) lub Variable

#### 2. `PUBLIC_SUPABASE_KEY`

- **Nazwa:** `PUBLIC_SUPABASE_KEY`
- **Wartość:** Twój publiczny klucz anon Supabase
- **Typ:** Secret (zalecane)

#### 3. `E2E_USERNAME`

- **Nazwa:** `E2E_USERNAME`
- **Wartość:** Email testowego użytkownika (np. `test@example.com`)
- **Typ:** Secret lub Variable

#### 4. `E2E_PASSWORD`

- **Nazwa:** `E2E_PASSWORD`
- **Wartość:** Hasło testowego użytkownika
- **Typ:** Secret (obowiązkowo!)

### 📋 Krok po kroku

1. **Kliknij "New repository secret"**
2. **Wpisz nazwę** (dokładnie jak powyżej, z wielkimi literami)
3. **Wklej wartość**
4. **Kliknij "Add secret"**
5. **Powtórz dla wszystkich 4 sekretów**

### ✅ Weryfikacja

Po dodaniu sekretów:

1. Utwórz nowy Pull Request
2. Sprawdź logi w zakładce **Actions**
3. W kroku "Debug - Sprawdź zmienne środowiskowe" zobaczysz:
   - Czy wszystkie zmienne są ustawione (powinno być `true`)
   - Długości zmiennych (dla weryfikacji)
   - Pierwsze 20 znaków URL (reszta zamaskowana)

### 🔍 Debugowanie

Jeśli testy E2E nie działają:

1. **Sprawdź logi workflow** - krok "Debug - Sprawdź zmienne środowiskowe"
2. **Upewnij się że:**
   - Wszystkie 4 sekrety są ustawione
   - Nazwy są DOKŁADNIE jak wyżej (z wielkimi literami)
   - Wartości są poprawne (sprawdź w Supabase dashboard)
3. **Testowy użytkownik musi:**
   - Być zarejestrowany w Supabase
   - Mieć zweryfikowany email
   - Mieć dostęp do aplikacji

### 🚀 Dodatkowe informacje

- **Secrets** są zawsze zamaskowane w logach (bezpieczne)
- **Variables** są widoczne w logach (dla niepoufnych danych)
- Zmienne są przekazywane do workflow przez `env:` w job'ie
- Playwright automatycznie otrzymuje te zmienne przez `webServer.env`

### 📚 Linki

- [GitHub Actions - Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase - Getting your project keys](https://supabase.com/docs/guides/api/api-keys)
