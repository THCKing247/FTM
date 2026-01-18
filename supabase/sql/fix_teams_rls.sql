-- Fix Teams RLS Policy Issue
-- Run this in Supabase SQL Editor

-- Step 1: Check current policies
SELECT 
  policyname, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY policyname;

-- Step 2: Drop all existing teams policies
DROP POLICY IF EXISTS teams_select_member ON public.teams;
DROP POLICY IF EXISTS teams_insert_authenticated ON public.teams;
DROP POLICY IF EXISTS teams_update_owner_or_coach ON public.teams;
DROP POLICY IF EXISTS teams_delete_owner ON public.teams;

-- Step 3: Recreate policies with correct permissions
-- SELECT: Users can see teams they're members of
CREATE POLICY teams_select_member
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (public.is_team_member(id));

-- INSERT: Any authenticated user can create teams
-- The trigger will set created_by automatically
CREATE POLICY teams_insert_authenticated
  ON public.teams
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Only owners and coaches can update
CREATE POLICY teams_update_owner_or_coach
  ON public.teams
  FOR UPDATE
  TO authenticated
  USING (public.has_team_role(id, array['owner','coach']::public.team_member_role[]))
  WITH CHECK (public.has_team_role(id, array['owner','coach']::public.team_member_role[]));

-- DELETE: Only owners can delete
CREATE POLICY teams_delete_owner
  ON public.teams
  FOR DELETE
  TO authenticated
  USING (public.has_team_role(id, array['owner']::public.team_member_role[]));

-- Step 4: Verify trigger exists and is correct
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'teams';

-- Step 5: If trigger is missing, recreate it
DROP TRIGGER IF EXISTS teams_set_created_by ON public.teams;
CREATE TRIGGER teams_set_created_by
BEFORE INSERT ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- Step 6: Verify the set_created_by function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'set_created_by';

-- Step 7: Ensure all auth users have profiles (run this if users exist without profiles)
-- This creates profiles for any auth users that don't have one yet
INSERT INTO public.profiles (id, display_name)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, '')
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
