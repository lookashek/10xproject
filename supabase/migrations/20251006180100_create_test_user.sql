-- =====================================================
-- Migration: Create Test User for MVP
-- Purpose: Create a test user with placeholder UUID for development
-- =====================================================
-- 
-- This creates a test user that matches the PLACEHOLDER_USER_ID in the API
-- User ID: 00000000-0000-0000-0000-000000000000
-- =====================================================

-- Insert test user into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'test@mvp.local',
  crypt('test-password-123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Test MVP User"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Note: Identities are not required for basic testing
-- The user in auth.users is sufficient for foreign key constraints
-- Test user credentials: email: test@mvp.local, password: test-password-123

