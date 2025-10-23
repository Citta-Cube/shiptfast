import { createClient } from '@/lib/supabase/server';

export async function getOrderById(id) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, companies(*), origin_port:ports!origin_port_id(*), destination_port:ports!destination_port_id(*)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAllOrders() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      origin_port:ports!origin_port_id(*),
      destination_port:ports!destination_port_id(*),
      quotes:quotes(count)
    `)
    .order('created_at', { ascending: false });
  
    const orders = data.map(({ quotes, ...order }) => ({
      ...order,
      quote_count: quotes[0].count
    }));

  if (error) throw error;
  return orders;
}

export async function createOrder(orderData, selectedForwarderIds, documents = []) {
  // TODO: Check if user has permission to create order from user session 
  const supabase = createClient();
  const { data: order, error: orderError } = await supabase
    .rpc('create_order', {
      order_data: {
        reference_number: orderData.reference_number,
        exporter_id: orderData.exporter_id,
        shipment_type: orderData.shipment_type,
        load_type: orderData.load_type,
        incoterm: orderData.incoterm,
        cargo_ready_date: orderData.cargo_ready_date,
        quotation_deadline: orderData.quotation_deadline,
        is_urgent: orderData.is_urgent,
        origin_port_id: orderData.origin_port_id,
        destination_port_id: orderData.destination_port_id,
        order_details: orderData.order_details
      },
      forwarder_ids: selectedForwarderIds,
      documents_data: documents.map(doc => ({
        title: doc.title,
        description: doc.description || null,
        file_url: doc.file_url,
        metadata: doc.metadata || {}
      }))
    });

  if (orderError) {
    console.error('Error creating order with forwarders:', orderError);
    throw orderError;
  }
  return order;
}

export async function getOrdersByExporter(exporterId, status) {
  const supabase = createClient();
  let query = supabase
    .from('orders')
    .select('*, companies(*)')
    .eq('exporter_id', exporterId);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

export async function getOrderDocuments(orderId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *
    `)
    .eq('entity_type', 'ORDER')
    .eq('entity_id', orderId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getQuoteDocumentsByQuoteId(quoteId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *
    `)
    .eq('entity_type', 'ORDER_QUOTE')
    .eq('entity_id', quoteId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getOrderQuotes(orderId) {
  try {
    const supabase = createClient();
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select(`
        *,
        companies:freight_forwarder_id (
          name,
          average_rating,
          total_orders,
          total_ratings
        ),
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
      .order('created_at', { ascending: false });

    if (error) throw error;
    return quotes;
  } catch (error) {
    console.error('Error fetching quotes:', error);
    throw error;
  }
}

export async function cancelOrder(orderId) {
  try {
    // TODO: Check if user has permission to cancel order from user session 
    const supabase = createClient();
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single();

    if (checkError) throw checkError;
    if (!existingOrder) throw new Error('Order not found');
    if (existingOrder.status === 'CANCELLED') throw new Error('Order is already cancelled');

    // Proceed with cancellation
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: 'CANCELLED',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    // Update any active quotes to cancelled
    const { error: quotesError } = await supabase
      .from('quotes')
      .update({ 
        status: 'CANCELLED',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .eq('status', 'ACTIVE');

    if (quotesError) throw quotesError;

    return data;
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
}