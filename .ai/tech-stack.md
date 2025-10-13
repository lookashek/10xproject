# Stos technologiczny projektu 10x-cards

Astro 5 – generowanie stron statycznych i "islands architecture"
- Szybki Time-to-First-Byte i minimalny JavaScript w przeglądarce

React 19 – interaktywne komponenty UI
- Bogaty ekosystem hooków, kontekst i komponentów społeczności

TypeScript 5 – statyczne typowanie JavaScriptu
- Wykrywanie błędów w czasie kompilacji i lepsze autouzupełnianie w IDE

Tailwind CSS 4 – narzędziowy framework CSS
- Bardzo szybkie prototypowanie stylów bez konfliktów klas

shadcn/ui – zestaw komponentów React opartych na Tailwind
- Gotowe formularze, modale i elementy UI spójne z design systemem

Supabase – backend-as-a-service (Postgres + Auth + Edge Functions)
- Rejestracja i logowanie, przechowywanie fiszek, uprawnienia RLS

OpenRouter.ai – warstwa proxy do wielu modeli LLM
- Jeden endpoint API, fallback między dostawcami, opcje prywatności danych

GitHub Actions – automatyzacja CI/CD
- Budowanie, testy i deployment przy każdym pushu do repozytorium

DigitalOcean App Platform – hosting aplikacji
- Skalowalny serwer statyczny, TLS i łatwe zmienne środowiskowe

## Testy i jakość (na podstawie `.ai/test-plan.md`)

- Testy jednostkowe/integracyjne:
  - Vitest – runner i asercje
  - @testing-library/react – testy komponentów UI
  - MSW – mockowanie `fetch`/OpenRouter oraz zewnętrznych usług
  - supertest/undici – testy integracyjne API (`src/pages/api/**`)
  - Pokrycie: `vitest --coverage`

- Testy E2E i dostępność:
  - Playwright – scenariusze E2E (auth, generate→accept, CRUD, study, redirecty)
  - axe-core/@axe-core/playwright – skany dostępności na głównych widokach

- Raportowanie/CI:
  - JUnit/HTML reporters dla Vitest/Playwright
  - GitHub Actions – uruchamianie lint/build/test przy każdym pushu