CREATE OR REPLACE FUNCTION create_order(
  order_data jsonb,
  forwarder_ids uuid[],
  documents_data jsonb[] DEFAULT '{}'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id uuid;
  forwarder_id uuid;
  v_exporter_id uuid = (order_data->>'exporter_id')::uuid;
  invalid_forwarders text[];
  inactive_forwarders text[];
  doc jsonb;
  current_user_id uuid;
  raw_sub text;
BEGIN
  -- Get current user ID from session safely (works with non-UUID providers like Clerk)
  -- Prefer reading the raw sub claim and only cast if it matches UUID format
  raw_sub := (auth.jwt() ->> 'sub');
  IF raw_sub ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    current_user_id := raw_sub::uuid;
  ELSE
    current_user_id := NULL; -- leave null when sub is not a UUID
  END IF;
  
  -- Check if all forwarders have a relationship with the exporter
  SELECT 
    array_agg(fc.name) FILTER (WHERE fc.status = 'no_relationship'),
    array_agg(fc.name) FILTER (WHERE fc.status = 'inactive')
  INTO 
    invalid_forwarders,
    inactive_forwarders
  FROM (
    SELECT 
      f.id,
      f.name,
      CASE 
        WHEN fr.id IS NULL THEN 'no_relationship'
        WHEN fr.status != 'ACTIVE' THEN 'inactive'
        ELSE 'valid'
      END as status
    FROM unnest(forwarder_ids) f_id
    JOIN companies f ON f.id = f_id
    LEFT JOIN forwarder_relationships fr 
      ON fr.forwarder_id = f.id 
    AND fr.exporter_id = v_exporter_id
  ) fc;

  -- Raise exception if any forwarders are invalid or inactive
  IF invalid_forwarders IS NOT NULL AND array_length(invalid_forwarders, 1) > 0 THEN
    RAISE EXCEPTION 'No relationship exists with forwarders: %', array_to_string(invalid_forwarders, ', ');
  END IF;

  IF inactive_forwarders IS NOT NULL AND array_length(inactive_forwarders, 1) > 0 THEN
    RAISE EXCEPTION 'Inactive relationship with forwarders: %', array_to_string(inactive_forwarders, ', ');
  END IF;

  -- Insert the order
  INSERT INTO orders (
    reference_number,
    exporter_id,
    shipment_type,
    load_type,
    incoterm,
    cargo_ready_date,
    quotation_deadline,
    is_urgent,
    origin_port_id,
    destination_port_id,
    order_details,
    require_inland_delivery,
    final_delivery_address,
    final_destination_country_code
  )
  SELECT
    (order_data->>'reference_number')::text,
    v_exporter_id,
    (order_data->>'shipment_type')::service,
    (order_data->>'load_type')::load_type,
    (order_data->>'incoterm')::incoterm,
    (order_data->>'cargo_ready_date')::timestamp with time zone,
    (order_data->>'quotation_deadline')::timestamp with time zone,
    (order_data->>'is_urgent')::boolean,
    (order_data->>'origin_port_id')::uuid,
    (order_data->>'destination_port_id')::uuid,
    (order_data->>'order_details')::jsonb,
    COALESCE((order_data->>'require_inland_delivery')::boolean, false),
    CASE WHEN (order_data ? 'final_delivery_address') THEN (order_data->'final_delivery_address')::jsonb ELSE NULL END,
    NULLIF(order_data->>'final_destination_country_code', '')
  RETURNING id INTO new_order_id;

  -- Insert selected forwarders
  FOREACH forwarder_id IN ARRAY forwarder_ids
  LOOP
    INSERT INTO order_selected_forwarders (
      order_id,
      freight_forwarder_id
    ) VALUES (
      new_order_id,
      forwarder_id
    );
  END LOOP;

  -- Insert documents
  IF array_length(documents_data, 1) > 0 THEN
    FOREACH doc IN ARRAY documents_data
    LOOP
      INSERT INTO documents (
        title,
        description,
        file_url,
        uploaded_by,
        entity_type,
        entity_id,
        metadata
      ) VALUES (
        doc->>'title',
        doc->>'description',
        doc->>'file_url',
        current_user_id,
        'ORDER',
        new_order_id,
        COALESCE((doc->>'metadata')::jsonb, '{}'::jsonb)
      );
    END LOOP;
  END IF;

  -- Return the created order with documents
  RETURN (
    SELECT jsonb_build_object(
      'order', row_to_json(o.*),
      'documents', COALESCE(
        (
          SELECT jsonb_agg(row_to_json(d.*))
          FROM documents d
          WHERE d.entity_type = 'ORDER'
          AND d.entity_id = o.id
        ),
        '[]'::jsonb
      )
    )
    FROM orders o
    WHERE o.id = new_order_id
  );
END;
$$;