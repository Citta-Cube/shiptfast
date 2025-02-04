create table
  public.ports (
    id uuid not null default extensions.uuid_generate_v4 (),
    port_code text not null,
    name text not null,
    country_code text not null,
    service public.service not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint ports_pkey primary key (id),
    constraint ports_port_code_key unique (port_code)
  ) tablespace pg_default;