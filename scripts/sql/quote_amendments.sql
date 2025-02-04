create table
  public.quote_amendments (
    id uuid not null default extensions.uuid_generate_v4 (),
    quote_id uuid null,
    previous_net_freight_cost double precision not null,
    new_net_freight_cost double precision not null,
    reason text null,
    created_at timestamp with time zone not null default now(),
    constraint quote_amendments_pkey primary key (id),
    constraint quote_amendments_quote_id_fkey foreign key (quote_id) references quotes (id)
  ) tablespace pg_default;

create index if not exists idx_quote_amendments_quote_id on public.quote_amendments using btree (quote_id) tablespace pg_default;