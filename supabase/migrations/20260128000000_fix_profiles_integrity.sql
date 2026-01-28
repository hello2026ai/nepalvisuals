-- ⚠️ SAFETY CHECK FIRST ⚠️
-- Run this SELECT query to see exactly which profiles are "broken" (orphaned)
-- and will be deleted. These are profiles that have no matching login account.
-- If this list contains anything important, DO NOT proceed without backing them up.
/*
SELECT * FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);
*/

-- ==========================================
-- THE FIX (Global Solution)
-- ==========================================

-- 1. Remove "Zombie" Profiles
-- We must remove profiles that don't have a user account because they prevent
-- us from enabling the strict security rules (Foreign Keys).
-- These profiles cannot log in anyway.
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Enforce Data Integrity (The Global Fix)
-- This ensures that in the future:
-- a) You can never have a profile without a user.
-- b) If you delete a user from Auth, their profile is automatically cleaned up.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. Verify the fix
-- If this runs successfully, your database is now self-healing.
