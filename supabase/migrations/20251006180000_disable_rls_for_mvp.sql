-- =====================================================
-- Migration: Disable RLS for MVP Testing
-- Purpose: Temporarily disable Row Level Security to allow testing without authentication
-- =====================================================
-- 
-- ⚠️ WARNING: This migration disables security policies!
-- Re-enable RLS when authentication is implemented.
-- 
-- To re-enable RLS later, run:
-- ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.generation_error_logs ENABLE ROW LEVEL SECURITY;
-- =====================================================

-- Disable RLS on generations table
ALTER TABLE public.generations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on flashcards table
ALTER TABLE public.flashcards DISABLE ROW LEVEL SECURITY;

-- Disable RLS on generation_error_logs table
ALTER TABLE public.generation_error_logs DISABLE ROW LEVEL SECURITY;

-- Add comment to track this change
COMMENT ON TABLE public.generations IS 'RLS disabled for MVP testing - re-enable when auth is ready';
COMMENT ON TABLE public.flashcards IS 'RLS disabled for MVP testing - re-enable when auth is ready';
COMMENT ON TABLE public.generation_error_logs IS 'RLS disabled for MVP testing - re-enable when auth is ready';

