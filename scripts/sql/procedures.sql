create or replace function select_quote(p_order_id uuid, p_quote_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_selected_quote_exists boolean;
begin
  -- Check if the quote exists and belongs to the order
  select exists(
    select 1 
    from quotes 
    where id = p_quote_id and order_id = p_order_id
  ) into v_selected_quote_exists;

  if not v_selected_quote_exists then
    raise exception 'Quote not found or does not belong to this order';
  end if;

  -- Begin transaction
  begin
    -- Update the order with the selected quote
    update orders
    set selected_quote_id = p_quote_id,
        status = 'CLOSED'
    where id = p_order_id;

    -- Reject all other quotes for this order
    update quotes
    set status = 'REJECTED'
    where order_id = p_order_id
    and id != p_quote_id;

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