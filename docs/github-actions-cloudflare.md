# 🚀 Konfiguracja Cloudflare Pages Deployment

## Wymagane zmienne środowiskowe dla deploymentu

Aby deployment na Cloudflare Pages działał poprawnie w GitHub Actions, musisz ustawić następujące sekrety w repozytorium.

### 📍 Gdzie ustawić zmienne?

1. Przejdź do swojego repozytorium na GitHub
2. Kliknij **Settings** (Ustawienia)
3. W lewym menu wybierz **Secrets and variables** → **Actions**
4. Kliknij **New repository secret**

### 🔑 Wymagane sekrety

Musisz dodać następujące sekrety:

#### 1. `CLOUDFLARE_API_TOKEN`

- **Nazwa:** `CLOUDFLARE_API_TOKEN`
- **Wartość:** API Token z Cloudflare
- **Typ:** Secret (obowiązkowo!)
- **Uprawnienia:** Token musi mieć uprawnienia do **Cloudflare Pages**

**Jak utworzyć token:**

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Przejdź do **My Profile** → **API Tokens**
3. Kliknij **Create Token**
4. Wybierz template **Edit Cloudflare Workers** lub utwórz custom token z uprawnieniami:
   - Account → Cloudflare Pages → Edit
5. Skopiuj token (będzie pokazany tylko raz!)

#### 2. `CLOUDFLARE_ACCOUNT_ID`

- **Nazwa:** `CLOUDFLARE_ACCOUNT_ID`
- **Wartość:** Twój Account ID z Cloudflare
- **Typ:** Secret lub Variable

**Jak znaleźć Account ID:**

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Przejdź do **Workers & Pages**
3. Account ID znajduje się w prawym panelu lub w URL

#### 3. `CLOUDFLARE_PROJECT_NAME`

- **Nazwa:** `CLOUDFLARE_PROJECT_NAME`
- **Wartość:** Nazwa twojego projektu w Cloudflare Pages
- **Typ:** Secret lub Variable

**Uwaga:** Nazwa projektu musi już istnieć w Cloudflare Pages. Utwórz projekt przed pierwszym deploymentem.

#### 4. `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_KEY`

- Te sekrety powinny być już ustawione dla testów E2E
- Są również używane podczas budowania aplikacji

### 📋 Krok po kroku

1. **Kliknij "New repository secret"**
2. **Wpisz nazwę** (dokładnie jak powyżej)
3. **Wklej wartość**
4. **Kliknij "Add secret"**
5. **Powtórz dla wszystkich sekretów**

### 🎯 Jak uruchomić deployment

1. Przejdź do zakładki **Actions** w repozytorium
2. Wybierz workflow **Deploy to Cloudflare Pages**
3. Kliknij **Run workflow**
4. Wybierz środowisko:
   - **production** - deployment produkcyjny
   - **preview** - deployment testowy
5. Kliknij **Run workflow**

### 📦 Co się dzieje podczas deploymentu?

Workflow wykonuje następujące kroki **sekwencyjnie**:

1. **Linting** - sprawdzenie jakości kodu
2. **Unit Tests** - uruchomienie testów jednostkowych z pokryciem
3. **Build** - zbudowanie aplikacji z adapterem Cloudflare
4. **Deploy** - wdrożenie na Cloudflare Pages
5. **Quality Gate** - podsumowanie całego procesu

### ✅ Weryfikacja

Po uruchomieniu deploymentu:

1. Sprawdź logi w zakładce **Actions**
2. W kroku "Deploy to Cloudflare Pages" zobaczysz:
   - URL aplikacji
   - Deployment ID
   - Status deploymentu
3. W kroku "Deployment summary" znajdziesz podsumowanie

### 🔍 Debugowanie

Jeśli deployment nie działa:

1. **Sprawdź logi workflow** w zakładce Actions
2. **Upewnij się że:**
   - Wszystkie sekrety są ustawione
   - Nazwy są DOKŁADNIE jak wyżej
   - API Token ma odpowiednie uprawnienia
   - Projekt istnieje w Cloudflare Pages
   - Account ID jest poprawny
3. **Częste problemy:**
   - Brak uprawnień API Token → utwórz nowy token z prawidłowymi uprawnieniami
   - Nieprawidłowy Account ID → sprawdź w Cloudflare Dashboard
   - Projekt nie istnieje → utwórz projekt w Cloudflare Pages

### 🆚 Różnica między production i preview

- **production**: Deployment na główną domenę produkcyjną
- **preview**: Deployment na tymczasowy URL do testowania

### 🔧 Konfiguracja Cloudflare Pages

W ustawieniach projektu w Cloudflare Pages:

1. **Build command:** `npm run build`
2. **Build output directory:** `dist`
3. **Environment variables:**
   - `NODE_VERSION`: `22`
   - `CLOUDFLARE`: `1`
   - `PUBLIC_SUPABASE_URL`: [Twój URL]
   - `PUBLIC_SUPABASE_KEY`: [Twój klucz]

### 🌐 Zmienne środowiskowe

Projekt automatycznie wykrywa środowisko Cloudflare:

- Używa adaptera `@astrojs/cloudflare` gdy `CLOUDFLARE=1` lub `CF_PAGES=1`
- Używa adaptera `@astrojs/node` dla lokalnego developmentu i testów E2E

### 📚 Linki

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- [Cloudflare Pages GitHub Action](https://github.com/cloudflare/pages-action)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [GitHub Actions - Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

### 🚨 Ważne uwagi

- **Nie commituj** tokenów API do repozytorium
- **Używaj** GitHub Secrets dla wszystkich poufnych danych
- **Testuj** najpierw na środowisku preview przed deploymentem na production
- **Monitoruj** logi deploymentu w Cloudflare Dashboard

### 💡 Porady

- Utwórz osobne tokeny dla różnych projektów
- Regularnie rotuj API tokeny (np. co 90 dni)
- Używaj Environment protection rules w GitHub dla produkcji
- Włącz branch protection dla głównych gałęzi
