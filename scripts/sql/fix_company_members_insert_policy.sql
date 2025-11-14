-- Fix infinite recursion in company_members INSERT policy
-- The issue: The INSERT policy queries company_members to check if user is admin,
-- which triggers RLS policies recursively, causing infinite recursion.
-- Solution: Create a SECURITY DEFINER function that bypasses RLS to check admin status.

-- Step 1: Create a function to check if the current user is an admin or manager for a company
-- This function uses SECURITY DEFINER to bypass RLS when querying company_members
CREATE OR REPLACE FUNCTION public.user_is_company_admin_or_manager(check_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_user_id text;
  jwt_payload jsonb;
BEGIN
  -- Get the JWT payload
  jwt_payload := auth.jwt();
  
  -- Extract user ID from JWT token (Clerk user ID is in 'sub' claim)
  jwt_user_id := jwt_payload ->> 'sub';
  
  -- If no JWT or user ID, return false
  IF jwt_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has ADMIN or MANAGER role in the company
  -- SECURITY DEFINER allows this query to bypass RLS
  RETURN EXISTS (
    SELECT 1
    FROM public.company_members
    WHERE company_id = check_company_id
      AND user_id = jwt_user_id
      AND is_active = true
      AND role IN ('ADMIN', 'MANAGER')
  );
END;
$$;

-- Step 2: Drop the existing INSERT policy if it exists
DROP POLICY IF EXISTS "admin can create company members" ON "public"."company_members";

-- Step 3: Create the new INSERT policy using the function
-- This avoids infinite recursion because the function bypasses RLS
CREATE POLICY "admin can create company members"
ON "public"."company_members"
FOR INSERT
TO public
WITH CHECK (
  user_is_company_admin_or_manager(company_id)
);

-- Optional: Add a comment to document the function
COMMENT ON FUNCTION public.user_is_company_admin_or_manager(uuid) IS 
'Checks if the current user (from JWT) has ADMIN or MANAGER role for the given company. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion in policies.';

