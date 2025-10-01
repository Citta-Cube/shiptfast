-- Update company_members table to support Clerk user IDs (text instead of uuid)
-- This migration changes the user_id column from uuid to text to support Clerk user IDs

-- First, drop the foreign key constraint
alter table public.company_members drop constraint if exists company_members_user_id_fkey;

-- Change the user_id column type from uuid to text
alter table public.company_members alter column user_id type text;

-- Update the unique constraint to work with text user_id
alter table public.company_members drop constraint if exists company_members_company_user_unique;
alter table public.company_members add constraint company_members_company_user_unique unique (company_id, user_id);

-- Recreate the index for the updated column type
drop index if exists idx_company_members_user;
create index idx_company_members_user on public.company_members using btree (user_id);

-- Add a comment to clarify the change
comment on column public.company_members.user_id is 'Clerk user ID (text format)';
