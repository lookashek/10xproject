<user_journey_analysis>

- Ścieżki (PRD + spec): `/`, `/login`, `/register`, `/settings`,
  chronione: `/generate`, `/dashboard`, `/flashcards`, `/study`,
  `/generations`, `/generations/[id]`.
- Główne podróże:
  1) Dostęp do chronionych stron (middleware + redirect),
  2) Rejestracja (MVP: auto‑login; alt: weryfikacja e‑mail),
  3) Logowanie (JWT w HttpOnly cookies),
  4) Wylogowanie,
  5) Zmiana hasła (w `Settings`),
  6) Usunięcie konta (admin API + cascade + wylogowanie).
- Punkty decyzyjne:
  - `isAuthenticated?` (middleware),
  - Walidacja formularzy (email/hasło),
  - Wynik logowania (200/401/429),
  - Rejestracja: sukces/konflikt/słabe hasło; tryb weryfikacji e‑mail,
  - Potwierdzenie operacji usunięcia konta ("DELETE").
- Opisy stanów (skróty):
  - Strony publiczne: wejście do logowania/rejestracji.
  - Middleware: ustalenie `locals.user` lub redirect.
  - Logowanie/Rejestracja: walidacja → próba → sukces/odmowa.
  - Chronione strony: dostęp tylko po sesji.
  - Settings: zmiana hasła/usunięcie konta.

</user_journey_analysis>

<mermaid_diagram>

```mermaid
stateDiagram-v2

[*] --> StronaGlowna

state "Publiczne strony" as Public {
  [*] --> StronaGlowna
  StronaGlowna --> LoginPage: CTA "Zaloguj się"
  StronaGlowna --> RegisterPage: CTA "Zarejestruj się"
}

state "Chronione strony" as Protected {
  [*] --> WejscieNaStrone
  WejscieNaStrone --> SprawdzenieAuth
  state SprawdzenieAuth <<choice>>
  SprawdzenieAuth --> WidokDocelowy: Zalogowany
  SprawdzenieAuth --> RedirectDoLogin: Niezalogowany
  RedirectDoLogin --> LoginPage
}

state "Proces Logowania" as Logowanie {
  [*] --> FormularzLogowania
  FormularzLogowania --> WalidacjaLogowania: Submit
  WalidacjaLogowania --> BledyWalidacji: Dane niepoprawne
  BledyWalidacji --> FormularzLogowania
  WalidacjaLogowania --> WyslanieZapytania
  WyslanieZapytania --> if_login
  state if_login <<choice>>
  if_login --> LoginSukces: 200 OK
  if_login --> LoginBlad: 401/429
  LoginBlad --> FormularzLogowania: Komunikat błędu
  LoginSukces --> UstawienieSesji
  UstawienieSesji --> RedirectPoLogowaniu
  RedirectPoLogowaniu --> GeneratePage

  note right of FormularzLogowania
    Pola: email, hasło. Enter = submit.
    Toasty: sukces/błąd. 
  end note
}

state "Proces Rejestracji" as Rejestracja {
  [*] --> FormularzRejestracji
  FormularzRejestracji --> WalidacjaRejestracji: Submit
  WalidacjaRejestracji --> BledyRejestracji: Email/hasło niewłaściwe
  BledyRejestracji --> FormularzRejestracji
  WalidacjaRejestracji --> ProbaRejestracji
  ProbaRejestracji --> if_email_mode
  state if_email_mode <<choice>>
  if_email_mode --> AutoLogin: MVP (bez weryfikacji)
  if_email_mode --> WeryfikacjaEmail: Tryb z weryfikacją

  AutoLogin --> SesjaUtworzona
  SesjaUtworzona --> RedirectPoRejestracji
  RedirectPoRejestracji --> GeneratePage

  WeryfikacjaEmail --> WyslanieMaila
  WyslanieMaila --> OczekiwanieNaPotwierdzenie
  OczekiwanieNaPotwierdzenie --> KlikniecieLinku
  KlikniecieLinku --> AktywacjaKonta
  AktywacjaKonta --> LoginPage

  note right of FormularzRejestracji
    Wymagania hasła: min 8, 1 wielka litera,
    1 cyfra. Email: format poprawny.
  end note
}

state "Ustawienia konta" as Settings {
  [*] --> PanelUstawien
  PanelUstawien --> ZmianaHasla: Wybór "Zmień hasło"
  ZmianaHasla --> WalidacjaNowegoHasla
  WalidacjaNowegoHasla --> HasloZmienione: 200 OK
  HasloZmienione --> PanelUstawien

  PanelUstawien --> UsuniecieKonta: Wybór "Usuń konto"
  UsuniecieKonta --> PotwierdzenieDELETE
  PotwierdzenieDELETE --> KontoUsuniete: Admin API OK
  KontoUsuniete --> WylogowaniePoSkasowaniu
  WylogowaniePoSkasowaniu --> StronaGlowna

  note right of ZmianaHasla
    Wymaga podania obecnego i nowego hasła.
    Sukces: komunikat i dalsza praca.
  end note

  note right of UsuniecieKonta
    Wpisz "DELETE" aby potwierdzić.
    Operacja nieodwracalna (CASCADE).
  end note
}

state "Wylogowanie" as Logout {
  [*] --> KlikniecieWyloguj
  KlikniecieWyloguj --> APIWyloguj
  APIWyloguj --> CzyszczenieSesji
  CzyszczenieSesji --> RedirectDoLogin
  RedirectDoLogin --> LoginPage
}

state "Przyszłe (opcjonalne)" as Future {
  [*] --> ResetHasla
  ResetHasla --> FormularzResetu
  FormularzResetu --> EmailZLinkiem
  EmailZLinkiem --> UstawNoweHaslo
  UstawNoweHaslo --> LoginPage
}

StronaGlowna --> Protected: Wejście na chronioną ścieżkę
LoginPage --> Logowanie
RegisterPage --> Rejestracja
GeneratePage --> Protected

note right of Protected
  Middleware ustawia locals.user dla zalogowanych,
  w przeciwnym razie redirect do /login?redirect=...
end note
```

</mermaid_diagram>


