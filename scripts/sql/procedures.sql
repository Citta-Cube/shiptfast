create or replace function select_quote(p_order_id uuid, p_quote_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_selected_quote_exists boolean;
  v_quote_status quote_status;
  v_order_status order_status;
begin
  -- Check if the quote exists and belongs to the order and capture its status
  select status 
  into v_quote_status
  from quotes 
  where id = p_quote_id and order_id = p_order_id;

  if not found then
    raise exception 'Quote not found or does not belong to this order';
  end if;

  -- Only ACTIVE quotes can be selected (prevents selecting WITHDRAWN/REVOKED/REJECTED etc.)
  if v_quote_status is distinct from 'ACTIVE' then
    raise exception 'Only ACTIVE quotes can be selected';
  end if;

  -- Get current order status
  select status into v_order_status from orders where id = p_order_id;

  -- Allow selection when order is OPEN, PENDING, or REASSIGN
  if v_order_status not in ('OPEN', 'PENDING', 'REASSIGN') then
    raise exception 'Order status % does not allow selecting a quote', v_order_status;
  end if;

  -- Begin transaction
  begin

  -- Set the selected quote status to SELECTED
  update quotes
  set status = 'SELECTED', updated_at = now()
  where id = p_quote_id;

  -- Update the order with the selected quote and close it
  update orders
  set selected_quote_id = p_quote_id,
    status = 'CLOSED'
  where id = p_order_id;

    -- Reject all other ACTIVE quotes for this order (do not touch WITHDRAWN or already REJECTED)
    update quotes
    set status = 'REJECTED'
    where order_id = p_order_id
      and id != p_quote_id
      and status = 'ACTIVE';

    -- Mark other forwarders as rejected in order_selected_forwarders
    update order_selected_forwarders
    set is_rejected = true
    where order_id = p_order_id
      and freight_forwarder_id != (
        select freight_forwarder_id 
        from quotes 
        where id = p_quote_id
      );

    -- Return the updated order and quote information
    return json_build_object(
      'success', true,
      'message', 'Quote selected successfully'
    );
  exception
    when others then
      raise exception 'Failed to select quote: %', sqlerrm;
  end;
end;
$$; 