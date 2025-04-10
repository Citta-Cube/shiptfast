-- Table to manage exporter-forwarder relationships
create table public.forwarder_relationships (
    id uuid not null default extensions.uuid_generate_v4(),
    exporter_id uuid not null,
    forwarder_id uuid not null,
    status public.status not null default 'INACTIVE',
    blacklist_reason text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint forwarder_relationships_pkey primary key (id),
    constraint forwarder_relationships_unique unique (exporter_id, forwarder_id),
    constraint forwarder_relationships_exporter_fkey 
        foreign key (exporter_id) 
        references companies (id)
        on delete cascade,
    constraint forwarder_relationships_forwarder_fkey 
        foreign key (forwarder_id) 
        references companies (id)
        on delete cascade
);

-- Trigger function to validate company types
create or replace function public.validate_company_types() 
returns trigger as $$
begin
    if not exists (
        select 1 from companies e 
        where e.id = new.exporter_id 
        and e.type = 'EXPORTER'::company_type
    ) then
        raise exception 'Invalid exporter type';
    end if;

    if not exists (
        select 1 from companies f 
        where f.id = new.forwarder_id 
        and f.type = 'FREIGHT_FORWARDER'::company_type
    ) then
        raise exception 'Invalid forwarder type';
    end if;

    return new;
end;
$$ language plpgsql;

-- Function to update the updated_at timestamp
create or replace function public.update_updated_at() 
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Trigger to call the update_updated_at function
create or replace trigger update_forwarder_relationships_updated_at
    before update on public.forwarder_relationships
    for each row
    execute function public.update_updated_at();

-- Trigger to call the validation function
create or replace trigger check_company_types
    before insert or update on public.forwarder_relationships
    for each row
    execute function public.validate_company_types();

-- Indexes for better query performance
create index idx_forwarder_relationships_exporter 
    on public.forwarder_relationships(exporter_id);
create index idx_forwarder_relationships_forwarder 
    on public.forwarder_relationships(forwarder_id);
create index idx_forwarder_relationships_status 
    on public.forwarder_relationships(status);

-- Update trigger for updated_at
create or replace trigger update_forwarder_relationships_updated_at
    before update on public.forwarder_relationships
    for each row
    execute function public.update_updated_at();


-- Function to automatically cancel quotes when forwarder is blacklisted/deactivated
CREATE OR REPLACE FUNCTION cancel_forwarder_quotes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if status is changing to INACTIVE or BLACKLISTED
    IF (TG_OP = 'UPDATE' AND 
        OLD.status != NEW.status AND 
        NEW.status IN ('INACTIVE', 'BLACKLISTED')) THEN
        
        -- Cancel all active quotes from this forwarder for this exporter
        UPDATE quotes q
        SET 
            status = 'CANCELLED',
            quote_details = jsonb_set(
                COALESCE(quote_details, '{}'::jsonb),
                '{cancellation_reason}',
                CASE 
                    WHEN NEW.status = 'BLACKLISTED' THEN '"FORWARDER_BLACKLISTED"'
                    ELSE '"FORWARDER_DEACTIVATED"'
                END::jsonb
            )
        FROM orders o
        WHERE 
            q.order_id = o.id
            AND o.exporter_id = NEW.exporter_id
            AND q.freight_forwarder_id = NEW.forwarder_id
            AND q.status = 'ACTIVE';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the function
CREATE TRIGGER cancel_quotes_on_relationship_change
    AFTER UPDATE ON forwarder_relationships
    FOR EACH ROW
    EXECUTE FUNCTION cancel_forwarder_quotes();