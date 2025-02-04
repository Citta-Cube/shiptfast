create type quote_status as enum ('ACTIVE', 'CANCELLED', 'EXPIRED');

create table
  public.quotes (
    id uuid not null default extensions.uuid_generate_v4 (),
    order_id uuid null,
    freight_forwarder_id uuid null,
    net_freight_cost double precision not null,
    estimated_time_days integer not null,
    validity_period_days integer null,
    note text null,
    quote_details jsonb null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    status quote_status not null default 'ACTIVE',
    constraint quotes_pkey primary key (id),
    constraint fk_quote_order_forwarder foreign key (order_id, freight_forwarder_id) references order_selected_forwarders (order_id, freight_forwarder_id),
    constraint quotes_freight_forwarder_id_fkey foreign key (freight_forwarder_id) references companies (id),
    constraint quotes_order_id_fkey foreign key (order_id) references orders (id),
    constraint quotes_selected_quote_fkey foreign key (id) references orders(selected_quote_id) deferrable initially deferred
  ) tablespace pg_default;

create index if not exists idx_quotes_freight_forwarder_id on public.quotes using btree (freight_forwarder_id) tablespace pg_default;

create index if not exists idx_quotes_order_id on public.quotes using btree (order_id) tablespace pg_default;

create trigger enforce_forwarder_selection_on_quote before insert on quotes for each row
execute function check_forwarder_selection_before_quote ();

create trigger track_quote_amendments before
update of net_freight_cost on quotes for each row when (
  old.net_freight_cost is distinct from new.net_freight_cost
)
execute function update_quote_with_amendment ('Price adjustment');