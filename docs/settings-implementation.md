# Implementacja Ustawień Konta

## Przegląd

Zaimplementowano pełną funkcjonalność ustawień konta dla użytkowników, obejmującą:
- ✅ Zmianę hasła z weryfikacją obecnego hasła
- ✅ Trwałe usuwanie konta użytkownika wraz z wszystkimi danymi

## Struktura

### Endpointy API

#### 1. `POST /api/auth/change-password`

**Opis:** Umożliwia zalogowanemu użytkownikowi zmianę hasła.

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Walidacja:**
- Obecne hasło jest wymagane i weryfikowane przez ponowne logowanie
- Nowe hasło musi spełniać wymagania:
  - Minimum 8 znaków
  - Przynajmniej jedna wielka litera
  - Przynajmniej jedna cyfra

**Odpowiedzi:**
- `200 OK` - Hasło zostało zmienione
- `400 Bad Request` - Błąd walidacji
- `401 Unauthorized` - Nieprawidłowe obecne hasło lub brak autoryzacji
- `500 Internal Server Error` - Błąd serwera

**Bezpieczeństwo:**
- Wymaga autoryzacji (middleware sprawdza `locals.user`)
- Weryfikuje obecne hasło przed zmianą (protection against session hijacking)
- Używa Supabase Auth do bezpiecznej zmiany hasła

#### 2. `DELETE /api/auth/delete-account`

**Opis:** Trwale usuwa konto użytkownika i wszystkie powiązane dane.

**Odpowiedzi:**
- `200 OK` - Konto zostało usunięte
- `401 Unauthorized` - Brak autoryzacji
- `500 Internal Server Error` - Błąd serwera

**Bezpieczeństwo:**
- Wymaga autoryzacji (middleware sprawdza `locals.user`)
- Używa funkcji RPC `delete_user_account()` z parametrem `security definer`
- Automatycznie usuwa tylko konto zalogowanego użytkownika (auth.uid())
- CASCADE DELETE usuwa wszystkie powiązane dane (fiszki, generacje, logi błędów)

**Działanie:**
1. Sprawdza autoryzację użytkownika
2. Wywołuje funkcję RPC `delete_user_account()`
3. Automatycznie wylogowuje użytkownika (`signOut()`)
4. Zwraca sukces

### Komponenty React

#### 1. `ChangePasswordForm.tsx`

Formularz do zmiany hasła z następującymi funkcjami:
- Walidacja hasła w czasie rzeczywistym (wizualne wskaźniki)
- Pokazywanie/ukrywanie hasła (ikony Eye/EyeOff)
- Sprawdzanie zgodności nowego hasła i potwierdzenia
- Wyświetlanie błędów walidacji i API
- Czyszczenie formularza po sukcesie

#### 2. `DeleteAccountSection.tsx`

Sekcja usuwania konta z następującymi funkcjami:
- Dialog potwierdzenia z wyjaśnieniem konsekwencji
- Wymagane wpisanie "DELETE" dla potwierdzenia
- Lista danych które zostaną usunięte
- Redirect do strony głównej po usunięciu

### Migracja bazy danych

**Plik:** `supabase/migrations/20251023000000_add_delete_user_function.sql`

**Funkcja RPC:** `delete_user_account()`

```sql
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
```

**Cechy:**
- `security definer` - wykonuje się z uprawnieniami właściciela funkcji
- Automatycznie używa `auth.uid()` dla bezpieczeństwa
- Usuwa użytkownika z `auth.users` co triggeru CASCADE DELETE
- Dostępna tylko dla użytkowników `authenticated`
- Niedostępna dla `anon`

## Testowanie

### Testy manualne

1. **Zmiana hasła:**
   ```
   1. Zaloguj się do aplikacji
   2. Przejdź do /settings
   3. Wypełnij formularz zmiany hasła:
      - Obecne hasło: [twoje obecne hasło]
      - Nowe hasło: [hasło spełniające wymagania]
      - Powtórz nowe hasło: [to samo hasło]
   4. Kliknij "Zmień hasło"
   5. Powinien pojawić się toast sukcesu
   6. Wyloguj się i zaloguj z nowym hasłem
   ```

2. **Usuwanie konta:**
   ```
   1. Zaloguj się do aplikacji
   2. Przejdź do /settings
   3. W sekcji "Strefa niebezpieczna" kliknij "Usuń konto"
   4. Przeczytaj ostrzeżenie w dialogu
   5. Wpisz "DELETE" w polu potwierdzenia
   6. Kliknij "Usuń konto na zawsze"
   7. Powinien pojawić się toast sukcesu
   8. Po 1.5s nastąpi redirect do strony głównej
   9. Konto i wszystkie dane zostały trwale usunięte
   ```

### Testy automatyczne (do implementacji)

Sugerowane testy E2E w Playwright:

```typescript
// e2e/settings.spec.ts
test('should change password successfully', async ({ page }) => {
  // Test zmiany hasła
});

test('should require correct current password', async ({ page }) => {
  // Test błędnego obecnego hasła
});

test('should validate new password requirements', async ({ page }) => {
  // Test walidacji nowego hasła
});

test('should delete account with confirmation', async ({ page }) => {
  // Test usuwania konta
});
```

## Bezpieczeństwo

### Zabezpieczenia zaimplementowane:

1. **Autoryzacja:**
   - Middleware sprawdza czy użytkownik jest zalogowany
   - Endpointy zwracają 401 dla niezalogowanych

2. **Walidacja:**
   - Zod schemas dla wszystkich inputów
   - Weryfikacja obecnego hasła przed zmianą

3. **RLS (Row Level Security):**
   - Funkcja RPC używa `auth.uid()` automatycznie
   - Użytkownik może usunąć tylko swoje konto

4. **CASCADE DELETE:**
   - Automatyczne usuwanie powiązanych danych
   - Zapobiega orphaned records

5. **Security Headers:**
   - Wszystkie odpowiedzi API zawierają security headers
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`

## Konfiguracja

### Zmienne środowiskowe

Wymagane zmienne (już skonfigurowane):
```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Uwaga:** Endpoint usuwania konta NIE wymaga `SUPABASE_SERVICE_ROLE_KEY` 
ponieważ używa bezpiecznej funkcji RPC zamiast Admin API.

### Migracje Supabase

Aby zastosować migrację:
```bash
# Jeśli używasz Supabase CLI lokalnie
supabase db push

# Lub zastosuj przez Supabase Dashboard:
# 1. Idź do SQL Editor
# 2. Skopiuj zawartość pliku 20251023000000_add_delete_user_function.sql
# 3. Wykonaj SQL
```

## Znane ograniczenia

1. **Brak rate limiting:** Endpointy nie mają dedykowanego rate limitingu
   (Supabase ma wbudowane, ale możemy dodać własne)

2. **Brak email powiadomień:** Użytkownik nie dostaje emaila po zmianie hasła
   lub usunięciu konta

3. **Nieodwracalne usunięcie:** Brak soft delete - dane są trwale usuwane
   (to jest feature, nie bug - zgodnie z GDPR)

## Przyszłe ulepszenia

- [ ] Email powiadomienia o zmianie hasła
- [ ] Email potwierdzenie przed usunięciem konta
- [ ] Opcja eksportu danych przed usunięciem konta
- [ ] Rate limiting na poziomie aplikacji
- [ ] Testy E2E dla wszystkich scenariuszy
- [ ] Możliwość reaktywacji konta (soft delete) - opcjonalnie

