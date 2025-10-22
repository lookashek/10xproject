-- =====================================================
-- Migration: Add delete_user_account RPC function
-- Purpose: Allow authenticated users to delete their own account
-- Security: Uses auth.uid() to ensure users can only delete their own account
-- =====================================================

-- Function: delete_user_account
-- Purpose: Delete the current authenticated user's account
-- Security: 
--   - Can only be called by authenticated users
--   - Automatically uses auth.uid() to ensure user can only delete their own account
--   - Cascades to delete all related data (generations, flashcards, error_logs)
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer -- Required to access auth schema
set search_path = public
as $$
declare
  current_user_id uuid;
begin
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- Ensure user is authenticated
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Delete the user from auth.users
  -- This will cascade delete all related data in public tables
  -- due to ON DELETE CASCADE constraints
  delete from auth.users where id = current_user_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.delete_user_account() to authenticated;

-- Revoke from anon to prevent unauthorized access
revoke execute on function public.delete_user_account() from anon;

-- Add comment for documentation
comment on function public.delete_user_account() is 
  'Allows authenticated users to delete their own account and all associated data. This operation is irreversible.';

