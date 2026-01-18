-- Complete Fix for Teams RLS Issue
-- Run this entire script in Supabase SQL Editor

-- Step 1: Ensure your profile exists
INSERT INTO public.profiles (id, display_name)
SELECT 
  '652938a9-7b00-48b9-936c-ce19ca0832a8'::uuid,
  COALESCE(raw_user_meta_data->>'full_name', email, 'User')
FROM auth.users
WHERE id = '652938a9-7b00-48b9-936c-ce19ca0832a8'::uuid
ON CONFLICT (id) DO UPDATE SET display_name = COALESCE(EXCLUDED.display_name, profiles.display_name);

-- Step 2: Verify profile was created
SELECT id, display_name, created_at 
FROM public.profiles 
WHERE id = '652938a9-7b00-48b9-936c-ce19ca0832a8'::uuid;

-- Step 3: Drop ALL existing teams policies
DROP POLICY IF EXISTS teams_select_member ON public.teams;
DROP POLICY IF EXISTS teams_insert_authenticated ON public.teams;
DROP POLICY IF EXISTS teams_update_owner_or_coach ON public.teams;
DROP POLICY IF EXISTS teams_delete_owner ON public.teams;

-- Step 4: Recreate INSERT policy - MOST PERMISSIVE VERSION
-- This allows ANY authenticated user to insert teams
CREATE POLICY teams_insert_authenticated
  ON public.teams
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Step 5: Recreate other policies
CREATE POLICY teams_select_member
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (public.is_team_member(id));

CREATE POLICY teams_update_owner_or_coach
  ON public.teams
  FOR UPDATE
  TO authenticated
  USING (public.has_team_role(id, array['owner','coach']::public.team_member_role[]))
  WITH CHECK (public.has_team_role(id, array['owner','coach']::public.team_member_role[]));

CREATE POLICY teams_delete_owner
  ON public.teams
  FOR DELETE
  TO authenticated
  USING (public.has_team_role(id, array['owner']::public.team_member_role[]));

-- Step 6: Verify trigger exists
DROP TRIGGER IF EXISTS teams_set_created_by ON public.teams;
CREATE TRIGGER teams_set_created_by
BEFORE INSERT ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- Step 7: Verify the set_created_by function
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'set_created_by';

-- Step 8: Test query to verify policies
SELECT 
  policyname, 
  cmd, 
  with_check
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY policyname;
