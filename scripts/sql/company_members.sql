create type public.company_role as enum (
    'ADMIN',              -- Can manage all company operations
    'MANAGER',            -- Can manage operational tasks and team members
    'OPERATOR',           -- Can perform day-to-day operations
    'VIEWER'              -- Read-only access to company data
);

create table public.company_members (
    id uuid not null default extensions.uuid_generate_v4(),
    company_id uuid not null references public.companies(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    job_title text,
    role public.company_role not null default 'VIEWER',
    is_active boolean not null default true,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint company_members_pkey primary key (id),
    constraint company_members_company_user_unique unique (company_id, user_id)
);

-- Add policy to ensure at least one ADMIN exists per company
create function public.ensure_company_admin()
returns trigger as $$
begin
    -- If this is an update that's changing the role from ADMIN
    if (TG_OP = 'UPDATE' AND OLD.role = 'ADMIN' AND NEW.role != 'ADMIN') then
        -- Check if this is the last admin
        if NOT EXISTS (
            select 1 from public.company_members 
            where company_id = NEW.company_id 
            and role = 'ADMIN' 
            and id != NEW.id
        ) then
            raise exception 'Cannot remove the last admin of the company';
        end if;
    end if;

    -- If this is a delete of an ADMIN
    if (TG_OP = 'DELETE' AND OLD.role = 'ADMIN') then
        -- Check if this is the last admin
        if NOT EXISTS (
            select 1 from public.company_members 
            where company_id = OLD.company_id 
            and role = 'ADMIN' 
            and id != OLD.id
        ) then
            raise exception 'Cannot delete the last admin of the company';
        end if;
    end if;

    if TG_OP = 'DELETE' then
        return OLD;
    end if;
    return NEW;
end;
$$ language plpgsql;

create trigger ensure_company_admin
    before update or delete on public.company_members
    for each row execute function public.ensure_company_admin();
  
create index idx_company_members_user on public.company_members using btree (user_id);
create index idx_company_members_company on public.company_members using btree (company_id);
create index idx_company_members_role on public.company_members using btree (role);