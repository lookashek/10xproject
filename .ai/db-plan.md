## 1. Tabele

### 1.1 flashcards

- id: **BIGSERIAL**, PRIMARY KEY
- user_id: **UUID**, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE
- generation_id: **BIGINT**, NULL, REFERENCES `generations(id)` ON DELETE SET NULL
- front: **VARCHAR(200)**, NOT NULL
- back: **VARCHAR(500)**, NOT NULL
- source: **VARCHAR(16)**, NOT NULL, CHECK (source IN ('ai-full', 'ai-edited', 'manual'))
- created_at: **TIMESTAMPTZ**, NOT NULL, DEFAULT `now()`
- updated_at: **TIMESTAMPTZ**, NOT NULL, DEFAULT `now()`
- CONSTRAINT: `flashcards_unique_user_front_back` UNIQUE(user_id, front, back)

### 1.2 generations

- id: **BIGSERIAL**, PRIMARY KEY
- user_id: **UUID**, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE
- model: **TEXT**, NOT NULL
- generated_count: **INT**, NOT NULL
- accepted_unedited_count: **INT**, NULLABLE
- accepted_edited_count: **INT**, NULLABLE
- source_text_hash: **TEXT**, NOT NULL
- source_text_length: **INT**, NOT NULL, CHECK (source_text_length BETWEEN 1000 AND 10000)
- generation_duration: **INT**
- created_at: **TIMESTAMPTZ**, NOT NULL, DEFAULT `now()`
- updated_at: **TIMESTAMPTZ**, NOT NULL, DEFAULT `now()`
- UNIQUE(user_id, source_text_hash)

### 1.3 generation_error_logs

- id: **BIGSERIAL**, PRIMARY KEY
- user_id: **UUID**, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE
- model: **TEXT**, NULL
- source_text_hash: **TEXT**, NOT NULL
- source_text_length: **INT**, NOT NULL, CHECK (source_text_length BETWEEN 1000 AND 10000)
- error_code: **TEXT**, NULL
- error_message: **TEXT**, NULL
- created_at: **TIMESTAMPTZ**, NOT NULL, DEFAULT `now()`
- UNIQUE(user_id, source_text_hash)

## 2. Relacje

- `auth.users.id` (1) → (N) `flashcards.user_id`
- `auth.users.id` (1) → (N) `generations.user_id`
- `auth.users.id` (1) → (N) `generation_error_logs.user_id`
- `generations.id` (1) → (N) `flashcards.generation_id`

## 3. Indeksy

- B-Tree `(user_id, created_at DESC)` na **flashcards**, **generations**, **generation_error_logs** (listowanie danych użytkownika)
- `flashcards_unique_user_front_back` (unikalny)
- Unikalne `(user_id, source_text_hash)` na **generations** oraz **generation_error_logs**
- (Opcjonalnie) GIN z `pg_trgm` na:
  ```sql
  CREATE INDEX flashcards_front_trgm_idx ON flashcards USING GIN (front gin_trgm_ops);
  CREATE INDEX flashcards_back_trgm_idx  ON flashcards USING GIN (back  gin_trgm_ops);
  ```

## 4. Zasady PostgreSQL (RLS)

```sql
-- Aktywacja RLS
aLTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;

-- Dostęp wyłącznie do własnych wierszy
CREATE POLICY flashcards_is_owner ON flashcards
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY generations_is_owner ON generations
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY generation_error_is_owner ON generation_error_logs
  USING (user_id = auth.uid());
```

## 5. Dodatkowe uwagi

1. **Triggery**: `BEFORE INSERT OR UPDATE` aktualizują `updated_at`; przy INSERT kopiują `created_at`.
