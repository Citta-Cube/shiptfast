import { createClient } from '@/lib/supabase/server';

/**
 * Company-wide Notification Service
 * Handles creating and managing system notifications at company level
 * Users can individually mark notifications as read
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
 * Create a company-wide notification (no duplicates per company)
 */
export async function createNotification({
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
      recipient_company_id: recipientCompanyId,
      type,
      title,
      message,
      order_id: orderId,
      quote_id: quoteId,
      message_id: messageId,
      sender_company_id: senderCompanyId,
      data,
      read_by: [],
      read_count: 0
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
 * Get notifications for a user in their company
 * Shows both read and unread notifications with user-specific read status
 */
export async function getUserNotifications(userId, companyId, limit = 50) {
  const supabase = createClient();
  
  try {
    // Use the SQL function to get notifications with user-specific read status
    const { data, error } = await supabase
      .rpc('get_user_company_notifications', {
        user_id: userId,
        company_id: companyId,
        limit_count: limit
      });

    if (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get user notifications:', error);
    throw error;
  }
}

/**
 * Get unread notifications count for a user in their company
 */
export async function getUnreadNotificationsCount(userId, companyId) {
  const supabase = createClient();
  
  try {
    // Use the SQL function to get unread notifications
    const { data, error } = await supabase
      .rpc('get_user_unread_notifications', {
        user_id: userId,
        company_id: companyId
      });

    if (error) {
      console.error('Error fetching unread notifications count:', error);
      throw error;
    }

    return data ? data.length : 0;
  } catch (error) {
    console.error('Failed to get unread notifications count:', error);
    throw error;
  }
}

/**
 * Mark a notification as read by a specific user
 */
export async function markNotificationAsRead(notificationId, userId) {
  const supabase = createClient();
  
  try {
    // Use the SQL function to mark as read
    const { data, error } = await supabase
      .rpc('mark_notification_read_by_user', {
        notification_id: notificationId,
        user_id: userId
      });

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }

    return data; // Returns true if successfully marked, false if already read
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
}

/**
 * Check if a user has read a specific notification
 */
export async function hasUserReadNotification(notificationId, userId) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .rpc('user_has_read_notification', {
        notification_id: notificationId,
        user_id: userId
      });

    if (error) {
      console.error('Error checking if user read notification:', error);
      throw error;
    }

    return data || false;
  } catch (error) {
    console.error('Failed to check if user read notification:', error);
    throw error;
  }
}

/**
 * Delete a notification (admin function)
 */
export async function deleteNotification(notificationId) {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete notification:', error);
    throw error;
  }
}

// Notification creation helper functions

/**
 * Notify about order creation (to freight forwarders)
 */
export async function notifyOrderCreated(order, exporter) {
  try {
    // Get all freight forwarder companies
    const supabase = createClient();
    const { data: forwarderCompanies, error } = await supabase
      .from('companies')
      .select('id')
      .eq('type', 'FREIGHT_FORWARDER');

    if (error) throw error;

    // Create notifications for each freight forwarder company
    const notifications = [];
    for (const company of forwarderCompanies) {
      if (company.id !== exporter.id) { // Don't notify the creating exporter
        const notification = await createNotification({
          recipientCompanyId: company.id,
          type: NotificationTypes.ORDER_CREATED,
          title: 'New Order Available',
          message: `New order "${order.reference}" from ${exporter.name} is available for quotation`,
          orderId: order.id,
          senderCompanyId: exporter.id,
          data: {
            order_reference: order.reference,
            exporter_name: exporter.name,
            port_of_loading: order.port_of_loading,
            port_of_discharge: order.port_of_discharge
          }
        });
        notifications.push(notification);
      }
    }

    return notifications;
  } catch (error) {
    console.error('Failed to notify order created:', error);
    throw error;
  }
}

/**
 * Notify about order cancellation
 */
export async function notifyOrderCancelled(order, exporter) {
  try {
    // Get selected freight forwarders for this order
    const supabase = createClient();
    const { data: selectedForwarders, error } = await supabase
      .from('order_selected_forwarders')
      .select('freight_forwarder_id')
      .eq('order_id', order.id);

    if (error) throw error;

    // Create notifications for each selected freight forwarder company
    const notifications = [];
    for (const forwarder of selectedForwarders) {
      const notification = await createNotification({
        recipientCompanyId: forwarder.freight_forwarder_id,
        type: NotificationTypes.ORDER_CANCELLED,
        title: 'Order Cancelled',
        message: `Order "${order.reference}" from ${exporter.name} has been cancelled`,
        orderId: order.id,
        senderCompanyId: exporter.id,
        data: {
          order_reference: order.reference,
          exporter_name: exporter.name
        }
      });
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error('Failed to notify order cancelled:', error);
    throw error;
  }
}

/**
 * Notify about order completion
 */
export async function notifyOrderCompleted(order, completingCompany) {
  try {
    const notification = await createNotification({
      recipientCompanyId: order.exporter_id,
      type: NotificationTypes.ORDER_CLOSED,
      title: 'Order Completed',
      message: `Your order "${order.reference}" has been completed`,
      orderId: order.id,
      senderCompanyId: completingCompany.id,
      data: {
        order_reference: order.reference,
        completing_company: completingCompany.name
      }
    });

    return notification;
  } catch (error) {
    console.error('Failed to notify order completed:', error);
    throw error;
  }
}

/**
 * Notify about new quote received
 */
export async function notifyQuoteReceived(quote, order, forwarder) {
  try {
    const notification = await createNotification({
      recipientCompanyId: order.exporter_id,
      type: NotificationTypes.QUOTE_RECEIVED,
      title: 'New Quote Received',
      message: `You received a new quote from ${forwarder.name} for order "${order.reference}"`,
      orderId: order.id,
      quoteId: quote.id,
      senderCompanyId: forwarder.id,
      data: {
        order_reference: order.reference,
        forwarder_name: forwarder.name,
        quote_amount: quote.net_freight_cost,
        currency: quote.currency
      }
    });

    return notification;
  } catch (error) {
    console.error('Failed to notify quote received:', error);
    throw error;
  }
}

/**
 * Notify about quote selection
 */
export async function notifyQuoteSelected(quote, order, exporter) {
  try {
    const notification = await createNotification({
      recipientCompanyId: quote.freight_forwarder_id,
      type: NotificationTypes.QUOTE_SELECTED,
      title: 'Your Quote Selected!',
      message: `Your quote for order "${order.reference}" has been selected by ${exporter.name}`,
      orderId: order.id,
      quoteId: quote.id,
      senderCompanyId: exporter.id,
      data: {
        order_reference: order.reference,
        exporter_name: exporter.name,
        quote_amount: quote.net_freight_cost
      }
    });

    return notification;
  } catch (error) {
    console.error('Failed to notify quote selected:', error);
    throw error;
  }
}

/**
 * Notify about new message
 */
export async function notifyNewMessage(message, order, sender, recipientCompanyId) {
  try {
    const isFromExporter = (sender.type || sender.company_type) === 'EXPORTER';
    
    const notification = await createNotification({
      recipientCompanyId: recipientCompanyId,
      type: isFromExporter ? NotificationTypes.NEW_MESSAGE_FORWARDER : NotificationTypes.NEW_MESSAGE_EXPORTER,
      title: 'New Message',
      message: `New message from ${sender.name} regarding order "${order.reference}"`,
      orderId: order.id,
      messageId: message.id,
      senderCompanyId: sender.id,
      data: {
        order_reference: order.reference,
        sender_name: sender.name,
        message_preview: message.message.substring(0, 100)
      }
    });

    return notification;
  } catch (error) {
    console.error('Failed to notify new message:', error);
    throw error;
  }
}

/**
 * Create deadline notifications (7 days and 24 hours before due dates)
 */
export async function createDeadlineNotifications() {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .rpc('check_deadline_notifications');

    if (error) {
      console.error('Error creating deadline notifications:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to create deadline notifications:', error);
    throw error;
  }
}

/**
 * Alias for createDeadlineNotifications for backward compatibility
 */
export async function checkAndCreateDeadlineNotifications() {
  return createDeadlineNotifications();
}

/**
 * Notify about order status changes (for backward compatibility)
 */
export async function notifyOrderStatusChange(orderId, oldStatus, newStatus) {
  try {
    // Normalize status to uppercase to match DB enum values
    const normalizedNewStatus = (newStatus || '').toUpperCase();
    // Get order details
    const supabase = createClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, companies!exporter_id(name)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found for status change notification:', orderId);
      return;
    }

    const exporter = order.companies;

    if (normalizedNewStatus === 'CANCELLED') {
      return await notifyOrderCancelled(order, exporter);
    } else if (normalizedNewStatus === 'COMPLETED') {
      return await notifyOrderCompleted(order, exporter);
    }

    return null;
  } catch (error) {
    console.error('Failed to notify order status change:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user (for backward compatibility)
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    // Get user's company
    const supabase = createClient();
    const { data: userCompany, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .single();

    if (companyError || !userCompany) {
      throw new Error('User company not found');
    }

    // Get all unread notifications for the user's company
    const { data: notifications, error: notificationsError } = await supabase
      .rpc('get_user_unread_notifications', {
        user_id: userId,
        company_id: userCompany.company_id
      });

    if (notificationsError) throw notificationsError;

    // Mark each notification as read by this user
    const results = [];
    for (const notification of notifications || []) {
      const result = await markNotificationAsRead(notification.id, userId);
      results.push(result);
    }

    return results;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
}

// Create the default export object
const notificationService = {
  NotificationTypes,
  createNotification,
  getUserNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  hasUserReadNotification,
  deleteNotification,
  notifyOrderCreated,
  notifyOrderCancelled,
  notifyOrderCompleted,
  notifyQuoteReceived,
  notifyQuoteSelected,
  notifyNewMessage,
  createDeadlineNotifications
};

// Export the named object as default
export default notificationService;