-- Final Fix - Simplest Possible Policy
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing policy
DROP POLICY IF EXISTS teams_insert_authenticated ON public.teams;

-- Step 2: Create the simplest possible policy (no checks at all)
CREATE POLICY teams_insert_authenticated
  ON public.teams
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 3: Verify it was created
SELECT 
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies 
WHERE tablename = 'teams'
  AND policyname = 'teams_insert_authenticated';

-- Step 4: Also ensure your profile exists
INSERT INTO public.profiles (id, display_name)
SELECT 
  '652938a9-7b00-48b9-936c-ce19ca0832a8'::uuid,
  COALESCE(raw_user_meta_data->>'full_name', email, 'User')
FROM auth.users
WHERE id = '652938a9-7b00-48b9-936c-ce19ca0832a8'::uuid
ON CONFLICT (id) DO NOTHING;

-- Step 5: Verify profile exists
SELECT id, display_name 
FROM public.profiles 
WHERE id = '652938a9-7b00-48b9-936c-ce19ca0832a8'::uuid;
