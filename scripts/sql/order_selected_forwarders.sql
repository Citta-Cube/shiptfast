create table
  public.order_selected_forwarders (
    id uuid not null default extensions.uuid_generate_v4 (),
    order_id uuid null,
    freight_forwarder_id uuid null,
    is_submitted boolean not null default false,
    is_rejected boolean not null default false,
    is_notified boolean not null default false,
    created_at timestamp with time zone not null default now(),
    constraint order_selected_forwarders_pkey primary key (id),
    constraint order_selected_forwarders_order_id_freight_forwarder_id_key unique (order_id, freight_forwarder_id),
    constraint order_selected_forwarders_freight_forwarder_id_fkey foreign key (freight_forwarder_id) references companies (id),
    constraint order_selected_forwarders_order_id_fkey foreign key (order_id) references orders (id)
  ) tablespace pg_default;

create index if not exists idx_order_selected_forwarders_forwarder_id on public.order_selected_forwarders using btree (freight_forwarder_id) tablespace pg_default;

create index if not exists idx_order_selected_forwarders_order_id on public.order_selected_forwarders using btree (order_id) tablespace pg_default;