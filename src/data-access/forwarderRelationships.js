import { supabase } from '@/lib/superbase';

/**
 * Updates the status of a forwarder relationship
 * @param {Object} params
 * @param {string} params.exporterId - The ID of the exporter
 * @param {string} params.forwarderId - The ID of the freight forwarder
 * @param {('ACTIVE'|'INACTIVE'|'BLACKLISTED')} params.status - The new status
 * @param {string} [params.blacklistReason] - Required if status is BLACKLISTED
 */
export async function updateForwarderStatus({
  exporterId,
  forwarderId,
  status,
  blacklistReason
}) {
  // Validate inputs
  if (!exporterId || !forwarderId || !status) {
    throw new Error('Missing required parameters');
  }

  if (status === 'BLACKLISTED' && !blacklistReason) {
    throw new Error('Blacklist reason is required when blacklisting a forwarder');
  }

  // Update the relationship
  const { data, error } = await supabase
    .from('forwarder_relationships')
    .update({
      status,
      blacklist_reason: status === 'BLACKLISTED' ? blacklistReason : null,
      updated_at: new Date().toISOString()
    })
    .match({
      exporter_id: exporterId,
      forwarder_id: forwarderId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Blacklists a freight forwarder
 */
export async function blacklistForwarder({
  exporterId,
  forwarderId,
  reason
}) {
  return updateForwarderStatus({
    exporterId,
    forwarderId,
    status: 'BLACKLISTED',
    blacklistReason: reason
  });
}

/**
 * Deactivates a freight forwarder
 */
export async function deactivateForwarder({
  exporterId,
  forwarderId
}) {
  return updateForwarderStatus({
    exporterId,
    forwarderId,
    status: 'INACTIVE'
  });
}

/**
 * Activates a freight forwarder
 */
export async function activateForwarder({
  exporterId,
  forwarderId
}) {
  return updateForwarderStatus({
    exporterId,
    forwarderId,
    status: 'ACTIVE'
  });
}

/**
 * Gets the cancelled quotes resulting from a status change
 */
export async function getCancelledQuotes({
  exporterId,
  forwarderId,
  fromDate
}) {
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      id,
      order_id,
      net_freight_cost,
      estimated_time_days,
      quote_details,
      created_at,
      updated_at,
      status,
      orders!inner (
        id,
        order_number,
        exporter_id
      )
    `)
    .eq('freight_forwarder_id', forwarderId)
    .eq('orders.exporter_id', exporterId)
    .eq('status', 'CANCELLED')
    .gte('updated_at', fromDate)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
} 