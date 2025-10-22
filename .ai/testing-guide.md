# Przewodnik po testach w projekcie 10x-cards

## Struktura testów

### Testy jednostkowe (Vitest + Testing Library)

Testy jednostkowe znajdują się w katalogach `__tests__` obok testowanych plików:

```
src/
├── components/ui/__tests__/
│   ├── alert.spec.tsx
│   ├── badge.spec.tsx
│   ├── button.spec.tsx
│   └── card.spec.tsx
├── lib/__tests__/
│   └── utils.spec.ts
├── lib/algorithms/__tests__/
│   └── sm2.spec.ts
└── lib/validation/__tests__/
    ├── flashcard.schemas.spec.ts
    └── generation.schemas.spec.ts
```

### Testy E2E (Playwright)

Testy E2E znajdują się w katalogu `e2e/`:

```
e2e/
├── pages/
│   └── HomePage.ts          # Page Object Model dla strony głównej
└── home.spec.ts             # Test strony głównej
```

## Konfiguracja

### Vitest (`vitest.config.ts`)

- **Environment**: `jsdom` (symulacja przeglądarki)
- **Setup**: `src/test/setup.ts` (importuje `@testing-library/jest-dom`)
- **Alias**: `@` → `./src`
- **Coverage**: v8 provider, raporty: text, html, lcov
- **Exclude**: pages, layouts, styles, type definitions

### Playwright (`playwright.config.ts`)

- **Browser**: Desktop Chrome (Chromium)
- **Port**: 4321 (Astro dev server)
- **Trace**: zachowywane przy błędach
- **Screenshot**: tylko przy błędach
- **Video**: zachowywane przy błędach
- **Viewport**: 1366x768

## Uruchamianie testów

### Testy jednostkowe

```bash
# Pojedyncze uruchomienie
npm run test

# Tryb watch (zalecany podczas developmentu)
npm run test:watch

# UI mode
npm run test:ui

# Z coverage
npm run test:coverage
```

### Testy E2E

```bash
# Instalacja przeglądarek (tylko raz)
npm run e2e:install

# Uruchomienie testów
npm run e2e

# UI mode
npm run e2e:ui

# Generowanie testów (codegen)
npm run e2e:codegen

# Raport HTML
npm run e2e:report
```

## Pisanie testów

### Testy komponentów React

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../button";

describe("Button", () => {
  it("wyświetla tekst i wywołuje onClick", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Kliknij</Button>);

    const btn = await screen.findByRole("button", { name: /kliknij/i });
    expect(btn).toBeInTheDocument();

    await user.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testy funkcji utility

```typescript
import { describe, expect, it } from "vitest";
import { cn } from "../utils";

describe("cn utility", () => {
  it("łączy klasy CSS", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });
});
```

### Testy algorytmów

```typescript
import { describe, expect, it, beforeEach } from "vitest";
import { sm2Algorithm } from "../sm2";

describe("SM2Algorithm", () => {
  it("inicjalizuje nową fiszkę", () => {
    const result = sm2Algorithm.initializeCard(1);

    expect(result).toMatchObject({
      flashcard_id: 1,
      easiness: 2.5,
      interval: 0,
      repetitions: 0,
    });
  });
});
```

### Testy walidacji (Zod schemas)

```typescript
import { describe, expect, it } from "vitest";
import { flashcardCreateSchema } from "../flashcard.schemas";

describe("flashcardCreateSchema", () => {
  it("parsuje poprawne dane", () => {
    const result = flashcardCreateSchema.parse({
      front: "Pytanie",
      back: "Odpowiedź",
      source: "manual",
    });

    expect(result.front).toBe("Pytanie");
  });

  it("odrzuca pusty front", () => {
    expect(() =>
      flashcardCreateSchema.parse({
        front: "",
        back: "Odpowiedź",
        source: "manual",
      })
    ).toThrow();
  });
});
```

### Testy E2E z Page Object Model

```typescript
// e2e/pages/HomePage.ts
import type { Locator, Page } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly heroTitle: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroTitle = page.getByRole("heading", { name: /10x cards/i });
    this.registerLink = page.getByRole("link", { name: /Zarejestruj się/i });
  }

  async goto() {
    await this.page.goto("/");
  }
}

// e2e/home.spec.ts
import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

test.describe("Strona główna", () => {
  test("renderuje hero i CTA", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.heroTitle).toBeVisible();
    await expect(home.registerLink).toBeVisible();

    // Visual regression testing
    await expect(page).toHaveScreenshot({ fullPage: true });
  });
});
```

## Best Practices

### Vitest

1. **Używaj `vi` do mocków** - `vi.fn()`, `vi.spyOn()`, `vi.mock()`
2. **Setup files dla globalnej konfiguracji** - `src/test/setup.ts`
3. **Inline snapshots** - `toMatchInlineSnapshot()` dla czytelności
4. **Watch mode podczas developmentu** - `npm run test:watch`
5. **jsdom dla testów komponentów** - symulacja DOM w Node.js
6. **Arrange-Act-Assert pattern** - struktura testów

### Playwright

1. **Page Object Model** - enkapsulacja selektorów i akcji
2. **Semantic locators** - `getByRole`, `getByLabel`, nie `querySelector`
3. **Visual regression** - `toHaveScreenshot()` dla porównań wizualnych
4. **Trace viewer** - debugowanie błędów z `--trace on`
5. **Codegen** - generowanie testów interaktywnie
6. **Parallel execution** - szybsze uruchamianie testów

## Pokrycie kodu (Coverage)

Aktualne pokrycie testami jednostkowymi:

- **UI Components** (Alert, Badge, Button, Card): 100%
- **Utils** (`cn` function): 100%
- **SM2 Algorithm**: 97.33%
- **Validation Schemas** (flashcard, generation): 100%

Raport coverage dostępny po uruchomieniu:

```bash
npm run test:coverage
# Raport HTML: coverage/index.html
```

## CI/CD Integration

Testy można zintegrować z GitHub Actions:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "22"
      - run: npm ci
      - run: npm run test:coverage

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "22"
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
```

## Debugowanie testów

### Vitest

```bash
# UI mode z debuggerem
npm run test:ui

# Pojedynczy test
npm run test -- src/lib/__tests__/utils.spec.ts

# Filtrowanie po nazwie
npm run test -- -t "cn utility"
```

### Playwright

```bash
# UI mode
npm run e2e:ui

# Debug mode (otwiera przeglądarkę)
npx playwright test --debug

# Trace viewer
npx playwright show-trace trace.zip
```

## Przydatne linki

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [jest-dom matchers](https://github.com/testing-library/jest-dom)
