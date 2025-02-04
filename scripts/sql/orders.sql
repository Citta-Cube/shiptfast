create table public.orders (
  id uuid not null default extensions.uuid_generate_v4 (),
  reference_number text not null,
  exporter_id uuid null,
  shipment_type public.service not null,
  load_type public.load_type not null,
  incoterm public.incoterm not null,
  cargo_ready_date timestamp with time zone not null,
  quotation_deadline timestamp with time zone not null,
  is_urgent boolean null default false,
  origin_port_id uuid null,
  destination_port_id uuid null,
  status public.order_status null default 'OPEN'::order_status,
  order_details jsonb null,
  selected_quote_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint orders_pkey primary key (id),
  constraint orders_exporter_id_reference_number_key unique (exporter_id, reference_number),
  constraint orders_destination_port_id_fkey foreign KEY (destination_port_id) references ports (id),
  constraint orders_exporter_id_fkey foreign KEY (exporter_id) references companies (id),
  constraint orders_origin_port_id_fkey foreign KEY (origin_port_id) references ports (id)
) TABLESPACE pg_default;

create index if not exists idx_orders_exporter_id on public.orders using btree (exporter_id) tablespace pg_default;
create index if not exists idx_orders_selected_quote_id on public.orders using btree (selected_quote_id) tablespace pg_default;

-- Trigger to update the updated_at column
CREATE FUNCTION public.update_orders_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.update_orders_updated_at();