-- Create the enum for main services
CREATE TYPE public.service AS ENUM ('AIR', 'SEA');

-- Create the forwarder_services table
CREATE TABLE public.forwarder_services (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    forwarder_id uuid NOT NULL,
    service public.service NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT forwarder_services_pkey PRIMARY KEY (id),
    CONSTRAINT forwarder_services_forwarder_id_fkey FOREIGN KEY (forwarder_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT forwarder_services_forwarder_id_service_key UNIQUE (forwarder_id, service)
);

CREATE INDEX idx_forwarder_services_forwarder_id ON public.forwarder_services USING btree (forwarder_id);
CREATE INDEX idx_forwarder_services_service ON public.forwarder_services USING btree (service);

-- Enable RLS
ALTER TABLE public.forwarder_services ENABLE ROW LEVEL SECURITY;

-- Trigger function to validate forwarder type
CREATE FUNCTION public.validate_forwarder_type()
RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM companies c
        WHERE c.id = NEW.forwarder_id 
        AND c.type = 'FREIGHT_FORWARDER'::company_type
    ) THEN
        RAISE EXCEPTION 'Invalid forwarder type';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the validation function before insert or update
CREATE TRIGGER check_forwarder_type
BEFORE INSERT OR UPDATE ON public.forwarder_services
FOR EACH ROW EXECUTE PROCEDURE public.validate_forwarder_type();

-- Trigger to update the updated_at column
CREATE FUNCTION public.update_forwarder_services_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_forwarder_services_updated_at
  BEFORE UPDATE ON public.forwarder_services
  FOR EACH ROW EXECUTE PROCEDURE public.update_forwarder_services_updated_at();