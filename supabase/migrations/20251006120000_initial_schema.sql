-- =====================================================
-- Migration: Initial Schema
-- Purpose: Create core tables for flashcard generation system
-- Tables: generations, flashcards, generation_error_logs
-- Features: RLS policies, indexes, triggers for updated_at
-- =====================================================

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Table: generations
-- Purpose: Track AI generation sessions and their statistics
-- Dependencies: auth.users (Supabase Auth)
create table if not exists public.generations (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model text not null,
  generated_count int not null,
  accepted_unedited_count int null,
  accepted_edited_count int null,
  source_text_hash text not null,
  source_text_length int not null check (source_text_length between 1000 and 10000),
  generation_duration int null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Prevent duplicate generations from the same source text per user
  constraint generations_unique_user_source unique(user_id, source_text_hash)
);

-- Table: flashcards
-- Purpose: Store user's flashcards (AI-generated or manual)
-- Dependencies: auth.users, generations
create table if not exists public.flashcards (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Optional link to generation session; set to null if generation is deleted
  generation_id bigint null references public.generations(id) on delete set null,
  front varchar(200) not null,
  back varchar(500) not null,
  -- Track the source: 'ai-full' (AI-generated, unedited), 'ai-edited' (AI-generated, user edited), 'manual' (user created)
  source varchar(16) not null check (source in ('ai-full', 'ai-edited', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Prevent duplicate flashcards per user
  constraint flashcards_unique_user_front_back unique(user_id, front, back)
);

-- Table: generation_error_logs
-- Purpose: Track failed generation attempts for debugging and analytics
-- Dependencies: auth.users
create table if not exists public.generation_error_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model text null,
  source_text_hash text not null,
  source_text_length int not null check (source_text_length between 1000 and 10000),
  error_code text null,
  error_message text null,
  created_at timestamptz not null default now(),
  -- Prevent duplicate error logs from the same source per user
  constraint generation_error_logs_unique_user_source unique(user_id, source_text_hash)
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

-- Index: flashcards by user and creation date (for efficient user data listing)
create index if not exists flashcards_user_created_idx 
  on public.flashcards(user_id, created_at desc);

-- Index: generations by user and creation date (for efficient user data listing)
create index if not exists generations_user_created_idx 
  on public.generations(user_id, created_at desc);

-- Index: generation_error_logs by user and creation date (for efficient user data listing)
create index if not exists generation_error_logs_user_created_idx 
  on public.generation_error_logs(user_id, created_at desc);

-- Optional GIN indexes for trigram similarity search on flashcard content
-- Uncomment the following lines to enable fuzzy text search (requires pg_trgm extension)
-- create extension if not exists pg_trgm;
-- create index if not exists flashcards_front_trgm_idx on public.flashcards using gin (front gin_trgm_ops);
-- create index if not exists flashcards_back_trgm_idx on public.flashcards using gin (back gin_trgm_ops);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables to ensure data isolation per user
alter table public.flashcards enable row level security;
alter table public.generations enable row level security;
alter table public.generation_error_logs enable row level security;

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- Policies for: flashcards
-- Rationale: Users should only access their own flashcards

-- Policy: Anonymous users cannot select flashcards
create policy flashcards_select_anon on public.flashcards
  for select
  to anon
  using (false);

-- Policy: Authenticated users can select their own flashcards
create policy flashcards_select_authenticated on public.flashcards
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Anonymous users cannot insert flashcards
create policy flashcards_insert_anon on public.flashcards
  for insert
  to anon
  with check (false);

-- Policy: Authenticated users can insert their own flashcards
create policy flashcards_insert_authenticated on public.flashcards
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Anonymous users cannot update flashcards
create policy flashcards_update_anon on public.flashcards
  for update
  to anon
  using (false)
  with check (false);

-- Policy: Authenticated users can update their own flashcards
create policy flashcards_update_authenticated on public.flashcards
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Anonymous users cannot delete flashcards
create policy flashcards_delete_anon on public.flashcards
  for delete
  to anon
  using (false);

-- Policy: Authenticated users can delete their own flashcards
create policy flashcards_delete_authenticated on public.flashcards
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Policies for: generations
-- Rationale: Users should only access their own generation records

-- Policy: Anonymous users cannot select generations
create policy generations_select_anon on public.generations
  for select
  to anon
  using (false);

-- Policy: Authenticated users can select their own generations
create policy generations_select_authenticated on public.generations
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Anonymous users cannot insert generations
create policy generations_insert_anon on public.generations
  for insert
  to anon
  with check (false);

-- Policy: Authenticated users can insert their own generations
create policy generations_insert_authenticated on public.generations
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Anonymous users cannot update generations
create policy generations_update_anon on public.generations
  for update
  to anon
  using (false)
  with check (false);

-- Policy: Authenticated users can update their own generations
create policy generations_update_authenticated on public.generations
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Anonymous users cannot delete generations
create policy generations_delete_anon on public.generations
  for delete
  to anon
  using (false);

-- Policy: Authenticated users can delete their own generations
create policy generations_delete_authenticated on public.generations
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Policies for: generation_error_logs
-- Rationale: Users should only access their own error logs; typically read-only for users

-- Policy: Anonymous users cannot select error logs
create policy generation_error_logs_select_anon on public.generation_error_logs
  for select
  to anon
  using (false);

-- Policy: Authenticated users can select their own error logs
create policy generation_error_logs_select_authenticated on public.generation_error_logs
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Anonymous users cannot insert error logs
create policy generation_error_logs_insert_anon on public.generation_error_logs
  for insert
  to anon
  with check (false);

-- Policy: Authenticated users can insert their own error logs
create policy generation_error_logs_insert_authenticated on public.generation_error_logs
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Anonymous users cannot update error logs
create policy generation_error_logs_update_anon on public.generation_error_logs
  for update
  to anon
  using (false)
  with check (false);

-- Policy: Authenticated users can update their own error logs
create policy generation_error_logs_update_authenticated on public.generation_error_logs
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Anonymous users cannot delete error logs
create policy generation_error_logs_delete_anon on public.generation_error_logs
  for delete
  to anon
  using (false);

-- Policy: Authenticated users can delete their own error logs
create policy generation_error_logs_delete_authenticated on public.generation_error_logs
  for delete
  to authenticated
  using (user_id = auth.uid());

-- =====================================================
-- 5. CREATE TRIGGERS FOR updated_at
-- =====================================================

-- Function: Update updated_at timestamp
-- Purpose: Automatically set updated_at to current timestamp on row update
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger: flashcards updated_at
create trigger flashcards_updated_at
  before update on public.flashcards
  for each row
  execute function public.handle_updated_at();

-- Trigger: generations updated_at
create trigger generations_updated_at
  before update on public.generations
  for each row
  execute function public.handle_updated_at();

-- Note: generation_error_logs doesn't have updated_at column, so no trigger needed

