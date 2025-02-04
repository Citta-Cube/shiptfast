create table
  public.transshipment_ports (
    id uuid not null default extensions.uuid_generate_v4 (),
    quote_id uuid null,
    port_id uuid null,
    sequence_number integer not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint transshipment_ports_pkey primary key (id),
    constraint transshipment_ports_quote_id_sequence_number_key unique (quote_id, sequence_number),
    constraint transshipment_ports_port_id_fkey foreign key (port_id) references ports (id),
    constraint transshipment_ports_quote_id_fkey foreign key (quote_id) references quotes (id)
  ) tablespace pg_default;

create index if not exists idx_transshipment_ports_quote_id on public.transshipment_ports using btree (quote_id) tablespace pg_default;