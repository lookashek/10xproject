# Dokument wymagań produktu (PRD) – 10x-cards (wersja rozszerzona)

## 1. Streszczenie produktu
10x-cards to webowa aplikacja do szybkiego tworzenia, edycji i nauki z fiszek. System wykorzystuje modele LLM (API) do półautomatycznego generowania wysokiej jakości fiszek z wklejonego tekstu źródłowego oraz prosty harmonogram powtórek oparty na bibliotece open-source. Celem MVP jest skrócenie czasu tworzenia fiszek i umożliwienie natychmiastowej nauki z minimalną konfiguracją.

## 2. Problem i propozycja wartości
- **Problem:** Tworzenie dobrych fiszek ręcznie jest kosztowne czasowo, przez co użytkownicy porzucają metodę spaced repetition.
- **Propozycja wartości:** Minimalny wysiłek wejścia (paste → generate → approve), szybka pętla edycji, jasny widok nauki oparty na sprawdzonym algorytmie powtórek, prywatność i własność danych.

## 3. Cele i wskaźniki (North Star + KPI)
- **North Star:** Liczba fiszek przerobionych w sesjach nauki na użytkownika tygodniowo.
- **KPI:** 
  - Współczynnik akceptacji fiszek AI ≥ 75%.
  - ≥ 75% nowo dodanych fiszek pochodzi z generowania AI.
  - Średnio ≥ 3 sesje nauki/tydzień/aktywny użytkownik.
  - Czas od wklejenia tekstu do pierwszej sesji ≤ 3 min.
  - NPS ≥ 40 wśród aktywnych po 2 tygodniach.

## 4. Zakres MVP i ograniczenia
- **W zakresie:** generowanie fiszek z LLM, ręczne tworzenie/edycja/usuwanie, prosty algorytm powtórek, podstawowe statystyki, konta i bezpieczeństwo, zgodność z RODO, podstawowa analityka zdarzeń.
- **Poza zakresem (MVP):** własny algorytm SR, gamifikacja, mobile apps, import PDF/DOCX, publiczne API, współdzielenie, zaawansowane powiadomienia, pełnotekstowe wyszukiwanie, offline-first, tryb zespołowy.

## 5. Wymagania funkcjonalne
1. **Generowanie fiszek (AI)**
   - Wklejenie tekstu 1000–10 000 znaków.
   - Wywołanie LLM z ustalonym promptem i ograniczeniami kosztów.
   - Otrzymanie listy propozycji (Q/A). Każda propozycja ma status: *proposed*, *edited*, *accepted*, *rejected*.
   - Akcje masowe: zaakceptuj wszystko, odrzuć wszystko, zapisz zaakceptowane.
   - Obsługa błędów API, limitów i timeoutów (komunikat + retry).
2. **Ręczne tworzenie i zarządzanie**
   - Formularz „Przód” i „Tył”, walidacja długości pól.
   - Edycja inline na liście lub w modalach.
   - Usuwanie z potwierdzeniem (soft delete w UI, hard delete w DB).
3. **Konta i uwierzytelnianie**
   - Rejestracja, logowanie, wylogowanie.
   - Zmiana hasła, usunięcie konta (DSR: right-to-erasure).
   - Sesje oparte o JWT; autoryzacja przez Supabase (mechanizmy wbudowane).
   - Ochrona wszystkich endpointów; niezalogowanych przekieruj do logowania/rejestracji.
4. **Sesja nauki (spaced repetition)**
   - Przygotowanie talii przez bibliotekę SR na podstawie *due date*.
   - Widok: pokaz przodu, odsłonięcie tyłu po interakcji.
   - Ocena odpowiedzi zgodnie z wymaganiami biblioteki (np. *Again/Hard/Good/Easy*).
   - Aktualizacja metryk fiszki i harmonogramu.
5. **Statystyki i raporty**
   - Liczba wygenerowanych przez AI i liczba zaakceptowanych.
   - Procent fiszek z AI wśród nowo dodanych.
   - Czas do pierwszej sesji i czas akceptacji.
6. **Zgodność i prywatność**
   - RODO: zgoda, dostęp do danych, prawo do usunięcia, polityka retencji.
   - Tylko właściciel ma dostęp do swoich fiszek. Brak współdzielenia w MVP.

## 6. Wymagania niefunkcjonalne
- **Wydajność:** TTI < 2,5 s na łączu 3G Fast; generowanie ≤ 20 s P95 przy 1k–5k znaków.
- **Niezawodność:** dostępność 99,5% w miesiącu; re-try dla calli LLM (exponential backoff).
- **Skalowalność:** horyzontalnie skalowalne API i kolejka zadań; ograniczenia stawek na użytkownika.
- **Bezpieczeństwo:** przechowywanie haseł zgodnie z dobrymi praktykami; TLS wszędzie; izolacja danych po ID użytkownika; audyt akcji wrażliwych.
- **A11y:** WCAG 2.1 AA dla kluczowych widoków.
- **I18n:** PL/EN w UI, treść fiszek pozostaje w języku użytkownika.
- **Obsługa błędów:** spójne kody i komunikaty; fallback dla LLM.

## 7. Architektura i komponenty (wysoki poziom)
- **Frontend:** SPA (React/Next.js), stan: React Query/Zustand, UI: kompaktowe listy + modale.
- **Backend:** API edge + worker/kolejka do wywołań LLM; webhooki Supabase dla zdarzeń auth.
- **Baza:** Supabase Postgres (RLS włączone), storage na załączniki w przyszłości.
- **Integracje:** Dostawca LLM przez API; biblioteka open-source SR (np. SM-2 lub FSRS).
- **Observability:** logi strukturalne, tracing requestów do LLM, metryki Prometheus-kompatybilne.

## 8. Model danych (propozycja)
```sql
-- users: zarządzane przez Supabase (id UUID)
create table cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  front text not null,
  back text not null,
  source enum('manual','ai') not null default 'manual',
  status enum('active','deleted') not null default 'active',
  sr_due_at timestamptz,
  sr_interval int,
  sr_ease real,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ai_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  front text not null,
  back text not null,
  proposal_status enum('proposed','edited','accepted','rejected') not null default 'proposed',
  tokens_input int,
  tokens_output int,
  model varchar(64),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table study_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  rating smallint not null, -- zgodnie z biblioteką SR
  reviewed_at timestamptz default now()
);
```
- **RLS:** każda tabela ograniczona `user_id = auth.uid()`.

## 9. API (MVP, szkic)
- `POST /ai/generate` body: `{ text, options? }` → 202 Accepted, job_id; `GET /ai/jobs/{id}` → wynik.
- `POST /cards` `{ front, back, source }`
- `GET /cards?status=active&limit=&offset=`
- `PATCH /cards/{id}` `{ front?, back? }`
- `DELETE /cards/{id}` hard delete (po potwierdzeniu)
- `POST /study/next` → zwraca kolejną fiszkę do nauki
- `POST /study/grade` `{ card_id, rating }` → aktualizacja SR
- Autoryzacja: Bearer JWT, wszystkie ścieżki za wyjątkiem zdrowia/autoryzacji chronione.

## 10. UX kluczowych ekranów
1. **Generowanie**: textarea 1000–10 000 znaków, licznik znaków, przycisk „Generuj”, stan „w toku”, lista propozycji z akcjami per wiersz i akcje masowe.
2. **Moje fiszki**: tabela z sortowaniem po dacie i due date, edycja inline, batch delete.
3. **Sesja nauki**: tryb fullscreen, skróty klawiaturowe, skala oceny zgodna z algorytmem, natychmiastowy feedback.

## 11. Wskazówki promptowania LLM
- Proś wynik w ściśle określonym JSON: `[{front: string, back: string}]`, bez komentarzy.
- Wymuś zwięzłość przodu i precyzyjność tyłu; unikać pytań wielokrotnych.
- Limituj liczbę fiszek do np. 20 na jedno wywołanie.
- Dodaj instrukcję filtrującą: usuń trywialne, duplikaty, niejednoznaczne.
- Zgłaszaj metryki: tokens_in/out, model, latency.

## 12. Analityka i zdarzenia
- `ai_generate_requested`, `ai_generate_succeeded`, `ai_generate_failed` (+powód)
- `proposal_accepted`, `proposal_rejected`, `proposal_edited`
- `card_created`, `card_updated`, `card_deleted`
- `study_started`, `study_graded`, `study_completed`
- Dashboard KPI w narzędziu analitycznym; PII zanonimizowane.

## 13. Zgodność, prywatność i bezpieczeństwo (RODO)
- **Podstawa prawna:** wykonanie usługi; osobno zgoda na analitykę.
- **Minimalizacja danych:** przechowujemy e-mail, hasło hash, fiszki, metryki techniczne.
- **Prawa użytkownika:** wgląd, eksport, usunięcie; SLA na realizację DSR ≤ 30 dni, w produkcie przycisk „Usuń konto” (natychmiast).
- **Retencja:** usunięte konto usuwa powiązane fiszki i metryki; backupy rotowane 30 dni.
- **Logi audytowe:** dostęp do danych ograniczony, wszystkie operacje wrażliwe logowane.
- **Sekrety:** przechowywane w managerze sekretów; rotacja kluczy LLM co 90 dni.

## 14. Ryzyka i mitigacje
- **Koszt LLM rośnie wraz z użyciem** → limity per użytkownik, batchowanie, cache, modele tańsze domyślnie.
- **Jakość generacji nierówna** → reguły walidacji, edycja przed zapisem, feedback loop (akceptacja/odrzucenie).
- **Vendor lock-in** → warstwa abstrakcji nad LLM, testy z co najmniej 2 dostawcami.
- **Nadużycia/treści wrażliwe** → filtracja treści po stronie promptu i po stronie serwera.
- **Utrata danych** → backupy codzienne, test odtworzeniowy miesięcznie.

## 15. Kryteria akceptacji (user stories)
**US-001 Rejestracja**  
- Formularz e-mail/hasło; po sukcesie auto-login i potwierdzenie.

**US-002 Logowanie i autoryzacja**  
- Prawidłowe dane → redirect do generowania. Błędne → komunikat. JWT + Supabase. Widoki logowania/rejestracji. Zmiana hasła, usunięcie konta. Logout.

**US-003 Generowanie (AI)**  
- Textarea 1k–10k znaków, klik „Generuj” → lista propozycji. Błąd API → komunikat i opcja ponów.

**US-004 Przegląd i zatwierdzanie**  
- Lista pod formularzem. Akcje: zatwierdź/edytuj/odrzuć. Zapis dodaje do DB.

**US-005 Edycja fiszek**  
- Edycja zapisanych fiszek (manual i AI). Zmiany zapisane w DB.

**US-006 Usuwanie**  
- Akcja usuń w „Moje fiszki”, potwierdzenie, trwałe usunięcie w DB.

**US-007 Ręczne tworzenie**  
- Dodanie nowej fiszki przez formularz „Przód/Tył”, zapis na liście.

**US-008 Sesja nauki**  
- Algorytm SR układa sesję. Odsłonięcie tyłu po interakcji, ocena, kolejna fiszka.

**US-009 Prywatność**  
- Dostęp tylko dla właściciela; brak współdzielenia.

## 16. Testy akceptacyjne (przykłady scenariuszy)
1. Generowanie z tekstu 1200 znaków → 10–20 propozycji, bez duplikatów, JSON poprawny.
2. Odcięcie internetu przy „Generuj” → komunikat o błędzie, przycisk „Spróbuj ponownie”.
3. Sesja nauki: 5 fiszek due → prawidłowa kolejność i aktualizacja harmonogramu po ocenach.
4. Usunięcie konta → brak możliwości zalogowania, fiszki znikają, log audytu zawiera wpis.
5. Użytkownik A nie widzi fiszek użytkownika B (RLS).
6. Szybkie odrzucenie 20 propozycji → brak degradacji wydajności UI.

## 17. Performance i SLO
- **API P95:** 300 ms dla operacji CRUD, 1–5 s dla wyników kolejki LLM (polling).
- **Frontend:** CLS < 0.1, LCP < 2,5 s.
- **Błędy:** < 1% nieudanych calli LLM miesięcznie (po retry).
- **Kolejka:** czas oczekiwania średnio < 10 s przy obciążeniu nominalnym.

## 18. Roadmap (wysoki poziom)
- **M1 (MVP):** generowanie, CRUD, sesja nauki, auth, RODO, statystyki podstawowe.
- **M2:** skróty klawiaturowe, i18n EN, dashboard KPI, batch actions rozbudowane.
- **M3:** import plików, udostępnianie, powiadomienia podstawowe, lepsze wyszukiwanie.

## 19. Słownik
- **Fiszka:** para przód/tył.
- **Propozycja (AI):** wygenerowana kandydatka fiszki przed akceptacją.
- **Due:** termin powtórki wg algorytmu SR.
- **SR:** spaced repetition.

---