-- Test and Fix Teams Insert Issue
-- Run this in Supabase SQL Editor

-- Step 1: Verify your profile exists
SELECT 
  'Profile Check' as test,
  id,
  display_name,
  created_at
FROM public.profiles 
WHERE id = '652938a9-7b00-48b9-936c-ce19ca0832a8'::uuid;

-- Step 2: Verify you're authenticated (should return your user ID)
SELECT 
  'Auth Check' as test,
  auth.uid() as current_user_id;

-- Step 3: Check if the teams table allows inserts
SELECT 
  'Table Check' as test,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'teams';

-- Step 4: Check current policies
SELECT 
  'Policy Check' as test,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY policyname;

-- Step 5: Try a test insert (this will help us see the exact error)
-- NOTE: This might fail, but it will show us WHY
DO $$
DECLARE
  test_team_id uuid;
BEGIN
  -- Try to insert a test team
  INSERT INTO public.teams (name, city, mascot, season_year, created_by)
  VALUES ('Test Team', 'Test City', 'Test Mascot', 2026, '652938a9-7b00-48b9-936c-ce19ca0832a8'::uuid)
  RETURNING id INTO test_team_id;
  
  -- If successful, delete it
  DELETE FROM public.teams WHERE id = test_team_id;
  
  RAISE NOTICE 'Test insert succeeded!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test insert failed: %', SQLERRM;
END $$;

-- Step 6: If profile doesn't exist, create it
INSERT INTO public.profiles (id, display_name)
SELECT 
  '652938a9-7b00-48b9-936c-ce19ca0832a8'::uuid,
  COALESCE(raw_user_meta_data->>'full_name', email, 'User')
FROM auth.users
WHERE id = '652938a9-7b00-48b9-936c-ce19ca0832a8'::uuid
ON CONFLICT (id) DO NOTHING;

-- Step 7: Make absolutely sure the insert policy is correct
DROP POLICY IF EXISTS teams_insert_authenticated ON public.teams;
CREATE POLICY teams_insert_authenticated
  ON public.teams
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.role() = 'authenticated');

-- Step 8: Verify trigger is set up correctly
SELECT 
  'Trigger Check' as test,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'teams'
  AND trigger_name = 'teams_set_created_by';
