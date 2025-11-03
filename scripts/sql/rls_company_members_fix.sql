-- Fix RLS for company_members table to work with Clerk authentication
-- This ensures users can read their own membership records when RLS is enabled

-- Step 1: Create a debug function to check what's in the JWT (for troubleshooting)
CREATE OR REPLACE FUNCTION public.debug_jwt()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN auth.jwt();
END;
$$;

-- Step 2: Create/Update the helper function to check company membership
CREATE OR REPLACE FUNCTION public.user_has_active_company_membership(check_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_user_id text;
  jwt_payload jsonb;
BEGIN
  -- Get the full JWT payload for debugging
  jwt_payload := auth.jwt();
  
  -- Extract user ID from JWT token
  -- Clerk's Supabase JWT template puts the Clerk user ID in the 'sub' claim
  jwt_user_id := jwt_payload ->> 'sub';
  
  -- If no JWT or user ID, return false
  IF jwt_user_id IS NULL THEN
    -- Log for debugging (remove in production)
    RAISE NOTICE 'JWT user_id is NULL. JWT payload: %', jwt_payload;
    RETURN false;
  END IF;
  
  -- Check if user has active membership in the company
  -- user_id is TEXT (Clerk user IDs), so direct comparison should work
  RETURN EXISTS (
    SELECT 1
    FROM public.company_members
    WHERE company_id = check_company_id
      AND user_id = jwt_user_id
      AND is_active = true
  );
END;
$$;

-- Step 2: Drop existing policies if they exist
DROP POLICY IF EXISTS "read own company_members" ON "public"."company_members";
DROP POLICY IF EXISTS "users can read own membership" ON "public"."company_members";
DROP POLICY IF EXISTS "users can read company members" ON "public"."company_members";

-- Step 3: Create RLS policies for company_members table

-- Policy 1: Users can read their own membership record
-- This is needed for getUserCompanyMembership() which queries by user_id
CREATE POLICY "users can read own membership"
ON "public"."company_members"
FOR SELECT
TO public
USING (
  user_id = (auth.jwt() ->> 'sub')
  AND is_active = true
);

-- Policy 2: Users can read members of companies they belong to
-- This is needed for getCompanyMembers() which queries by company_id
CREATE POLICY "users can read company members"
ON "public"."company_members"
FOR SELECT
TO public
USING (
  user_has_active_company_membership(company_id)
);

-- Policy 3: Users can update their own membership record
CREATE POLICY "users can update own membership"
ON "public"."company_members"
FOR UPDATE
TO public
USING (
  user_id = (auth.jwt() ->> 'sub')
)
WITH CHECK (
  user_id = (auth.jwt() ->> 'sub')
);

-- Policy 4: Service role can insert/update/delete (for API routes that need full access)
-- Note: This requires the service role key to be used in those specific routes

