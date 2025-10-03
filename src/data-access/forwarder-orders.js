import { createClient } from '@/lib/supabase/client';

export async function getForwarderOrderById(orderId, forwarderId) {
  const supabase = createClient();
  
  // First, check if the forwarder has access to this order
  const { data: orderSelectedForwarder, error: forwarderError } = await supabase
    .from('order_selected_forwarders')
    .select('*')
    .eq('order_id', orderId)
    .eq('freight_forwarder_id', forwarderId)
    .single();

  if (forwarderError) {
    throw new Error('Forwarder does not have access to this order');
  }

  // Get order details
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      origin_port:origin_port_id(*),
      destination_port:destination_port_id(*)
    `)
    .eq('id', orderId)
    .single();

  if (orderError) throw orderError;
  
  // Combine the order data with the order_selected_forwarder data
  const order = {
    ...orderData,
    order_selected_forwarder: orderSelectedForwarder
  };
  
  return order;
}

export async function getForwarderQuotes(orderId, forwarderId) {
  const supabase = createClient();
  
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select(`
      *,
      quote_amendments(*),
      transshipment_ports!quote_id (
        id,
        sequence_number,
        port:port_id (
          id,
          name,
          port_code,
          country_code
        )
      )
    `)
    .eq('order_id', orderId)
    .eq('freight_forwarder_id', forwarderId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return quotes;
}

// Reuse the existing getOrderDocuments function from orders.js
export { getOrderDocuments } from './orders'; 