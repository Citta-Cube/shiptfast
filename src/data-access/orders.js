import { createClient } from '@/lib/superbase/server';


const supabase = createClient();
export async function getOrderById(id) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, companies(*), origin_port:ports!origin_port_id(*), destination_port:ports!destination_port_id(*)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      companies(*),
      origin_port:ports!origin_port_id(*),
      destination_port:ports!destination_port_id(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createOrder(orderData, selectedForwarderIds, documents = []) {
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
  console.log("Order: ", order);
  return order;
}

export async function getOrdersByExporter(exporterId, status) {
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

export async function getOrderQuotes(orderId) {
  try {
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