create type public.document_entity_type as enum ('ORDER', 'COMPANY');

create table
  public.documents (
    id uuid not null default extensions.uuid_generate_v4(),
    title text not null,
    description text null,
    file_url text not null,
    uploaded_by uuid null,
    entity_type document_entity_type not null,
    entity_id uuid not null,
    metadata jsonb null default '{}'::jsonb,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint documents_pkey primary key (id),
    constraint documents_uploaded_by_fkey foreign key (uploaded_by) references auth.users (id)
  ) tablespace pg_default;

-- Create a composite index for efficient querying by entity
create index idx_documents_entity on public.documents using btree (entity_type, entity_id);

-- Create a GIN index for the metadata JSONB field
create index idx_documents_metadata on public.documents using gin (metadata);

-- Add check constraints to ensure entity_id references the correct table
create function public.validate_document_entity()
returns trigger as $$
begin
  case new.entity_type
    when 'ORDER' then
      if not exists (select 1 from public.orders where id = new.entity_id) then
        raise exception 'Invalid order_id for document';
      end if;
    when 'COMPANY' then
      if not exists (select 1 from public.companies where id = new.entity_id) then
        raise exception 'Invalid company_id for document';
      end if;
    -- Add more cases as needed
  end case;
  return new;
end;
$$ language plpgsql;

create trigger validate_document_entity
  before insert or update on public.documents
  for each row execute function public.validate_document_entity();