create table
  public.order_messages (
    id uuid not null default extensions.uuid_generate_v4 (),
    order_id uuid not null,
    sender_id uuid not null,
    to_id uuid not null,
    message text not null,
    created_at timestamp with time zone not null default now(),
    constraint order_messages_pkey primary key (id),
    constraint order_messages_order_id_fkey foreign key (order_id) references orders (id),
    constraint order_messages_sender_id_fkey foreign key (sender_id) references auth.users (id) on delete cascade,
    constraint order_messages_to_id_fkey foreign key (to_id) references auth.users (id) on delete cascade
  ) tablespace pg_default;

create index idx_order_messages_order_id on public.order_messages using btree (order_id);