import { createClient } from '@/lib/supabase/server';

/**
 * Notification Service
 * Handles creating and managing system notifications for the platform
 */

// Notification types enum (should match database enum)
export const NotificationTypes = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_DUE_7_DAYS: 'ORDER_DUE_7_DAYS',
  ORDER_DUE_24_HOURS: 'ORDER_DUE_24_HOURS',
  ORDER_CLOSED: 'ORDER_CLOSED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  NEW_MESSAGE_EXPORTER: 'NEW_MESSAGE_EXPORTER',
  NEW_MESSAGE_FORWARDER: 'NEW_MESSAGE_FORWARDER',
  QUOTE_RECEIVED: 'QUOTE_RECEIVED',
  QUOTE_SELECTED: 'QUOTE_SELECTED',
  QUOTE_CANCELLED: 'QUOTE_CANCELLED'
};

/**
 * Create a notification for specific recipients
 */
export async function createNotification({
  recipientId,
  recipientCompanyId,
  type,
  title,
  message,
  orderId = null,
  quoteId = null,
  messageId = null,
  senderCompanyId = null,
  data = {}
}) {
  const supabase = createClient();
  
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      recipient_id: recipientId,
      recipient_company_id: recipientCompanyId,
      type,
      title,
      message,
      order_id: orderId,
      quote_id: quoteId,
      message_id: messageId,
      sender_company_id: senderCompanyId,
      data,
      is_read: false
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
  
  return notification;
}

/**
 * Create notifications for all company members
 */
export async function createCompanyNotifications({
  companyId,
  type,
  title,
  message,
  orderId = null,
  quoteId = null,
  messageId = null,
  senderCompanyId = null,
  data = {}
}) {
  const supabase = createClient();
  
  // Get all active company members
  const { data: members, error: membersError } = await supabase
    .from('company_members')
    .select('id, user_id, company_id')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .not('user_id', 'is', null);
    
  if (membersError) {
    console.error('Error fetching company members:', membersError);
    throw membersError;
  }
  
  if (!members || members.length === 0) {
    console.warn(`No active members found for company ${companyId}`);
    return [];
  }
  
  // Create notifications for all members
  const notifications = await Promise.all(
    members.map(member => 
      createNotification({
        recipientId: member.user_id,
        recipientCompanyId: member.company_id,
        type,
        title,
        message,
        orderId,
        quoteId,
        messageId,
        senderCompanyId,
        data
      })
    )
  );
  
  return notifications;
}

/**
 * Order-related notifications
 */
export async function notifyOrderCreated(orderId) {
  const supabase = createClient();
  
  // Get order and selected forwarders
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      companies:exporter_id (name),
      order_selected_forwarders (
        freight_forwarder_id,
        companies:freight_forwarder_id (name)
      )
    `)
    .eq('id', orderId)
    .single();
    
  if (orderError || !order) {
    console.error('Error fetching order:', orderError);
    return;
  }
  
  // Notify all selected freight forwarders
  const notifications = await Promise.all(
    order.order_selected_forwarders.map(osf => 
      createCompanyNotifications({
        companyId: osf.freight_forwarder_id,
        type: NotificationTypes.ORDER_CREATED,
        title: 'New Order Available',
        message: `You have been invited to quote for order #${order.reference_number} from ${order.companies.name}`,
        orderId: order.id,
        senderCompanyId: order.exporter_id,
        data: {
          order_reference: order.reference_number,
          exporter_name: order.companies.name,
          quotation_deadline: order.quotation_deadline,
          cargo_ready_date: order.cargo_ready_date
        }
      })
    )
  );
  
  return notifications.flat();
}

export async function notifyOrderStatusChange(orderId, oldStatus, newStatus) {
  const supabase = createClient();
  
  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      companies:exporter_id (name),
      order_selected_forwarders (
        freight_forwarder_id,
        companies:freight_forwarder_id (name)
      )
    `)
    .eq('id', orderId)
    .single();
    
  if (orderError || !order) {
    console.error('Error fetching order:', orderError);
    return;
  }
  
  let notifications = [];
  
  // Handle order closed
  if (newStatus === 'CLOSED') {
    // Notify exporter
    const exporterNotifications = await createCompanyNotifications({
      companyId: order.exporter_id,
      type: NotificationTypes.ORDER_CLOSED,
      title: 'Order Closed',
      message: `Your order #${order.reference_number} has been closed`,
      orderId: order.id,
      data: {
        order_reference: order.reference_number,
        previous_status: oldStatus
      }
    });
    
    // Notify all freight forwarders
    const forwarderNotifications = await Promise.all(
      order.order_selected_forwarders.map(osf => 
        createCompanyNotifications({
          companyId: osf.freight_forwarder_id,
          type: NotificationTypes.ORDER_CLOSED,
          title: 'Order Closed',
          message: `Order #${order.reference_number} from ${order.companies.name} has been closed`,
          orderId: order.id,
          senderCompanyId: order.exporter_id,
          data: {
            order_reference: order.reference_number,
            exporter_name: order.companies.name
          }
        })
      )
    );
    
    notifications = [...exporterNotifications, ...forwarderNotifications.flat()];
  }
  
  // Handle order cancelled
  if (newStatus === 'CANCELLED') {
    // Notify all freight forwarders
    const forwarderNotifications = await Promise.all(
      order.order_selected_forwarders.map(osf => 
        createCompanyNotifications({
          companyId: osf.freight_forwarder_id,
          type: NotificationTypes.ORDER_CANCELLED,
          title: 'Order Cancelled',
          message: `Order #${order.reference_number} from ${order.companies.name} has been cancelled`,
          orderId: order.id,
          senderCompanyId: order.exporter_id,
          data: {
            order_reference: order.reference_number,
            exporter_name: order.companies.name
          }
        })
      )
    );
    
    notifications = forwarderNotifications.flat();
  }
  
  return notifications;
}

/**
 * Quote-related notifications
 */
export async function notifyQuoteReceived(quoteId) {
  const supabase = createClient();
  
  // Get quote details
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select(`
      *,
      orders (id, reference_number, exporter_id),
      companies:freight_forwarder_id (name)
    `)
    .eq('id', quoteId)
    .single();
    
  if (quoteError || !quote) {
    console.error('Error fetching quote:', quoteError);
    return;
  }
  
  // Notify exporter
  const notifications = await createCompanyNotifications({
    companyId: quote.orders.exporter_id,
    type: NotificationTypes.QUOTE_RECEIVED,
    title: 'New Quote Received',
    message: `You have received a new quote from ${quote.companies.name} for order #${quote.orders.reference_number}`,
    orderId: quote.order_id,
    quoteId: quote.id,
    senderCompanyId: quote.freight_forwarder_id,
    data: {
      forwarder_name: quote.companies.name,
      quote_amount: quote.net_freight_cost,
      order_reference: quote.orders.reference_number,
      estimated_time_days: quote.estimated_time_days
    }
  });
  
  return notifications;
}

export async function notifyQuoteSelected(quoteId) {
  const supabase = createClient();
  
  // Get quote details
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select(`
      *,
      orders (id, reference_number, exporter_id, companies:exporter_id (name)),
      companies:freight_forwarder_id (name)
    `)
    .eq('id', quoteId)
    .single();
    
  if (quoteError || !quote) {
    console.error('Error fetching quote:', quoteError);
    return;
  }
  
  // Notify freight forwarder
  const notifications = await createCompanyNotifications({
    companyId: quote.freight_forwarder_id,
    type: NotificationTypes.QUOTE_SELECTED,
    title: 'Your Quote Has Been Selected!',
    message: `Congratulations! Your quote for order #${quote.orders.reference_number} has been selected by ${quote.orders.companies.name}`,
    orderId: quote.order_id,
    quoteId: quote.id,
    senderCompanyId: quote.orders.exporter_id,
    data: {
      exporter_name: quote.orders.companies.name,
      quote_amount: quote.net_freight_cost,
      order_reference: quote.orders.reference_number
    }
  });
  
  return notifications;
}

export async function notifyQuoteCancelled(quoteId) {
  const supabase = createClient();
  
  // Get quote details
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select(`
      *,
      orders (id, reference_number, exporter_id),
      companies:freight_forwarder_id (name)
    `)
    .eq('id', quoteId)
    .single();
    
  if (quoteError || !quote) {
    console.error('Error fetching quote:', quoteError);
    return;
  }
  
  // Notify exporter
  const notifications = await createCompanyNotifications({
    companyId: quote.orders.exporter_id,
    type: NotificationTypes.QUOTE_CANCELLED,
    title: 'Quote Cancelled',
    message: `A quote from ${quote.companies.name} for order #${quote.orders.reference_number} has been cancelled`,
    orderId: quote.order_id,
    quoteId: quote.id,
    senderCompanyId: quote.freight_forwarder_id,
    data: {
      forwarder_name: quote.companies.name,
      order_reference: quote.orders.reference_number
    }
  });
  
  return notifications;
}

/**
 * Message-related notifications
 */
export async function notifyNewMessage(messageId) {
  const supabase = createClient();
  
  // Get message details
  const { data: message, error: messageError } = await supabase
    .from('order_messages')
    .select(`
      *,
      orders (id, reference_number),
      sender_company:sender_company_id (name, type),
      to_company:to_company_id (name, type)
    `)
    .eq('id', messageId)
    .single();
    
  if (messageError || !message) {
    console.error('Error fetching message:', messageError);
    return;
  }
  
  // Determine notification type based on sender type
  const notificationType = message.sender_company.type === 'EXPORTER' 
    ? NotificationTypes.NEW_MESSAGE_EXPORTER 
    : NotificationTypes.NEW_MESSAGE_FORWARDER;
    
  const title = message.sender_company.type === 'EXPORTER'
    ? 'New Message from Exporter'
    : 'New Message from Freight Forwarder';
  
  // Notify recipient company
  const notifications = await createCompanyNotifications({
    companyId: message.to_company_id,
    type: notificationType,
    title,
    message: `You have received a new message from ${message.sender_company.name} regarding order #${message.orders.reference_number}`,
    orderId: message.order_id,
    messageId: message.id,
    senderCompanyId: message.sender_company_id,
    data: {
      sender_company_name: message.sender_company.name,
      order_reference: message.orders.reference_number,
      message_preview: message.message.substring(0, 100) + (message.message.length > 100 ? '...' : '')
    }
  });
  
  return notifications;
}

/**
 * Deadline notifications (called by cron job)
 */
export async function checkAndCreateDeadlineNotifications() {
  const supabase = createClient();
  
  // Call the database function to check for deadline notifications
  const { error } = await supabase.rpc('check_deadline_notifications');
  
  if (error) {
    console.error('Error checking deadline notifications:', error);
    throw error;
  }
  
  console.log('Deadline notifications check completed');
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId, options = {}) {
  const supabase = createClient();
  const { 
    limit = 50, 
    offset = 0, 
    unreadOnly = false,
    orderBy = 'created_at',
    ascending = false
  } = options;
  
  let query = supabase
    .from('notifications')
    .select(`
      *,
      sender_company:sender_company_id (id, name, type),
      orders (id, reference_number),
      quotes (id, net_freight_cost),
      order_messages (id, message)
    `)
    .eq('recipient_id', userId)
    .order(orderBy, { ascending })
    .range(offset, offset + limit - 1);
    
  if (unreadOnly) {
    query = query.eq('is_read', false);
  }
  
  const { data: notifications, error } = await query;
  
  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
  
  return notifications || [];
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId, userId) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('id', notificationId)
    .eq('recipient_id', userId)
    .select()
    .single();
    
  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
  
  return data;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('recipient_id', userId)
    .eq('is_read', false)
    .select('id');
    
  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
  
  return data;
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId) {
  const supabase = createClient();
  
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);
    
  if (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
  
  return count;
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId, userId) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('recipient_id', userId);
    
  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
  
  return true;
}