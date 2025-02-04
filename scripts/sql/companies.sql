create table public.companies (
    id uuid not null default extensions.uuid_generate_v4(),
    name text not null,
    iconUrl text,
    email text not null,
    phone text,
    website text,
    address text,
    description text,
    type public.company_type not null,
    -- Core business details
    business_registration_number text,
    svat_number text,
    vat_number text,
    -- Metadata
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    is_verified boolean not null default false,
    average_rating decimal(3,2),
    total_ratings integer not null default 0,
    total_orders integer not null default 0,
    constraint companies_pkey primary key (id),
    constraint companies_email_key unique (email)
);

create index idx_companies_type on public.companies using btree (type);
create index idx_companies_metadata on public.companies using gin (metadata);

-- Enable RLS
alter table public.companies enable row level security;

-- Trigger to update the updated_at column
create function public.update_companies_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger update_companies_updated_at
  before update on public.companies
  for each row execute procedure public.update_companies_updated_at();