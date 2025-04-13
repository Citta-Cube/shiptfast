import { createClient } from '@/lib/supabase/server';

const supabase = createClient();

/**
 * Get orders available to a specific forwarder
 * @param {string} forwarderId - The forwarder's company ID
 * @param {string} status - Optional filter for order status (open, pending, selected, rejected)
 * @returns {Promise<Array>} - Orders with related data
 */
export async function getForwarderOrders(forwarderId, status = null) {
  // Base query to get orders where the forwarder is invited
  let query = supabase
    .from('order_selected_forwarders')
    .select(`
      id,
      is_submitted,
      is_rejected,
      is_selected,
      orders:order_id (
        id,
        reference_number,
        shipment_type,
        load_type,
        cargo_ready_date,
        quotation_deadline,
        is_urgent,
        status,
        created_at,
        exporter:exporter_id (
          id,
          name,
          iconurl
        ),
        origin_port:origin_port_id (
          id,
          port_code,
          name,
          country_code
        ),
        destination_port:destination_port_id (
          id, 
          port_code,
          name,
          country_code
        )
      ),
      quotes:quotes (
        id,
        net_freight_cost,
        estimated_time_days,
        validity_period_days,
        status,
        created_at
      )
    `)
    .eq('freight_forwarder_id', forwarderId)

  // Apply status filter if provided
  if (status) {
    switch(status.toLowerCase()) {
      case 'open':
        // Orders where forwarder is invited but hasn't submitted a quote
        query = query.eq('is_submitted', false).eq('is_rejected', false);
        break;
      case 'pending':
        // Orders where forwarder has submitted a quote but it's still active (no decision yet)
        query = query.eq('is_submitted', true);
        break;
      case 'selected':
        // Orders where forwarder's quote has been selected
        query = query.eq('is_submitted', true);
        break;
      case 'rejected':
        // Orders where forwarder's quote has been rejected
        query = query.eq('is_submitted', true);
        break;
    }
  }

  const { data, error } = await query.order('orders(cargo_ready_date)', { ascending: true });
  
  if (error) throw error;
  
  // Further filter the results in JavaScript (which is safer than relying on complex join conditions)
  let filteredData = data;
  if (status) {
    switch(status.toLowerCase()) {
      case 'pending':
        filteredData = data.filter(item => 
          item.quotes && 
          item.quotes.some(quote => quote.status === 'ACTIVE')
        );
        break;
      case 'selected':
        filteredData = data.filter(item => 
          item.quotes && 
          item.quotes.some(quote => quote.status === 'SELECTED')
        );
        break;
      case 'rejected':
        filteredData = data.filter(item => 
          item.quotes && 
          item.quotes.some(quote => quote.status === 'REJECTED')
        );
        break;
    }
  }
  
  // Flatten and transform the data for easier consumption
  return filteredData.map(item => {
    // For filtered status, ensure we only get the relevant quote
    let quote = null;
    if (status) {
      switch(status.toLowerCase()) {
        case 'pending':
          quote = item.quotes?.find(q => q.status === 'ACTIVE');
          break;
        case 'selected':
          quote = item.quotes?.find(q => q.status === 'SELECTED');
          break;
        case 'rejected':
          quote = item.quotes?.find(q => q.status === 'REJECTED');
          break;
        default:
          quote = item.quotes?.[0];
      }
    } else {
      quote = item.quotes?.[0];
    }
    
    return {
      id: item.orders.id,
      reference_number: item.orders.reference_number,
      shipment_type: item.orders.shipment_type,
      load_type: item.orders.load_type,
      cargo_ready_date: item.orders.cargo_ready_date,
      quotation_deadline: item.orders.quotation_deadline,
      is_urgent: item.orders.is_urgent,
      status: item.orders.status,
      created_at: item.orders.created_at,
      origin_port: item.orders.origin_port,
      destination_port: item.orders.destination_port,
      exporter: item.orders.exporter,
      quote: quote || null,
      is_submitted: item.is_submitted,
      is_rejected: item.is_rejected,
      is_selected: item.is_selected,
      invitation_id: item.id,
      quote_status: (() => {
        if (item.is_rejected) return 'rejected';
        if (!item.is_submitted && item.orders.status === 'OPEN') return 'open';
        if (item.is_submitted && item.orders.status === 'OPEN') return 'quoted';
        if (item.orders.status === 'PENDING') return 'pending';
        if (item.orders.status === 'CLOSED' && item.is_selected) return 'selected';
        return null;
      })()
    };
  });
}

/**
 * Get dashboard metrics for a forwarder
 * @param {string} forwarderId - The forwarder's company ID
 * @returns {Promise<Object>} - Dashboard metrics
 */
export async function getForwarderMetrics(forwarderId) {
  try {
    // Get counts of open orders (not submitted and order status is OPEN)
    const { data: openOrdersCount, error: openError } = await supabase
      .from('order_selected_forwarders')
      .select(`
        id,
        orders!inner (
          status
        )
      `)
      .eq('freight_forwarder_id', forwarderId)
      .eq('is_submitted', false)
      .eq('orders.status', 'OPEN');
    
    if (openError) throw openError;
    
    // Get count of pending orders (order status is PENDING)
    const { data: pendingOrdersCount, error: pendingError } = await supabase
      .from('order_selected_forwarders')
      .select(`
        id,
        orders!inner (
          status
        )
      `)
      .eq('freight_forwarder_id', forwarderId)
      .eq('orders.status', 'PENDING');
      
    if (pendingError) throw pendingError;
    
    // Get count of won orders (order status is CLOSED and forwarder is selected)
    const { data: wonOrdersCount, error: wonError } = await supabase
      .from('order_selected_forwarders')
      .select(`
        id,
        orders!inner (
          status
        )
      `)
      .eq('freight_forwarder_id', forwarderId)
      .eq('is_selected', true)
      .eq('orders.status', 'CLOSED');
      
    if (wonError) throw wonError;
    
    // Get forwarder details including rating
    const { data: forwarderData, error: forwarderError } = await supabase
      .from('companies')
      .select('average_rating, total_ratings')
      .eq('id', forwarderId)
      .single();
      
    if (forwarderError) throw forwarderError;
    
    return {
      openRequests: openOrdersCount?.length || 0,
      pendingQuotes: pendingOrdersCount?.length || 0,
      wonOrders: wonOrdersCount?.length || 0,
      rating: forwarderData?.average_rating || 0,
      totalRatings: forwarderData?.total_ratings || 0
    };
  } catch (error) {
    console.error('Error fetching forwarder metrics:', error);
    throw error;
  }
} 