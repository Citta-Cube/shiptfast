'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Bell, Check, MessageSquare, Package, FileText, Clock, CheckCheck, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const NotificationIcon = ({ type }) => {
  const iconProps = { className: 'w-4 h-4' };

  switch (type) {
    case 'ORDER_CREATED':
    case 'ORDER_CLOSED':
    case 'ORDER_CANCELLED':
      return <Package {...iconProps} />;
    case 'ORDER_DUE_7_DAYS':
    case 'ORDER_DUE_24_HOURS':
      return <Clock {...iconProps} />;
    case 'NEW_MESSAGE_EXPORTER':
    case 'NEW_MESSAGE_FORWARDER':
      return <MessageSquare {...iconProps} />;
    case 'QUOTE_RECEIVED':
    case 'QUOTE_SELECTED':
    case 'QUOTE_CANCELLED':
      return <FileText {...iconProps} />;
    default:
      return <Bell {...iconProps} />;
  }
};

// Text/content, generate titles/messages (company removed)
const getNotificationContent = (notification) => {
  const { type, order_reference_number, order_id, data, message, title } = notification;

  const nOrder =
    order_reference_number ||
    data?.order_reference ||
    data?.order_reference_number ||
    extractOrderFromMessage(message) ||
    order_id ||
    'N/A';

  // If original message already looks well-formed, use it
  if (message && (message.includes('"') || message.includes('#') || /[A-Z]{2,4}-\d+/.test(message))) {
    return {
      title: title || getDefaultTitle(type),
      message: message,
    };
  }

  switch (type) {
    case 'ORDER_CREATED':
      return {
        title: 'New Order Available',
        message: `A new order "${nOrder}" has been created and is available for quotation`,
      };
    case 'ORDER_CANCELLED':
      return {
        title: 'Order Cancelled',
        message: `Order "${nOrder}" has been cancelled`,
      };
    case 'ORDER_DUE_7_DAYS':
      return {
        title: 'Order Closing in 7 Days',
        message: `Order "${nOrder}" will close in 7 days`,
      };
    case 'ORDER_DUE_24_HOURS':
      return {
        title: 'Order Closing in 24 Hours',
        message: `Order "${nOrder}" will close in 24 hours`,
      };
    case 'QUOTE_RECEIVED':
      return {
        title: 'New Quote Received',
        message: `New quote received for order "${nOrder}"`,
      };
    case 'QUOTE_CANCELLED':
      return {
        title: 'Quote Cancelled',
        message: `Quote for order "${nOrder}" has been cancelled`,
      };
    case 'NEW_MESSAGE_EXPORTER':
    case 'NEW_MESSAGE_FORWARDER':
      return {
        title: 'New Message',
        message: `New message for order "${nOrder}"`,
      };
    case 'QUOTE_SELECTED':
      return {
        title: 'Quote Selected',
        message: `Your quote for order "${nOrder}" has been selected`,
      };
    case 'ORDER_CLOSED':
      return {
        title: 'Order Closed',
        message: `Order "${nOrder}" has been closed`,
      };
    default:
      return {
        title: title || 'Notification',
        message: message || 'New notification received',
      };
  }
};

const getDefaultTitle = (type) => {
  switch (type) {
    case 'ORDER_CREATED':
      return 'New Order Available';
    case 'ORDER_CANCELLED':
      return 'Order Cancelled';
    case 'ORDER_DUE_7_DAYS':
      return 'Order Closing in 7 Days';
    case 'ORDER_DUE_24_HOURS':
      return 'Order Closing in 24 Hours';
    case 'QUOTE_RECEIVED':
      return 'New Quote Received';
    case 'QUOTE_CANCELLED':
      return 'Quote Cancelled';
    case 'NEW_MESSAGE_EXPORTER':
    case 'NEW_MESSAGE_FORWARDER':
      return 'New Message';
    case 'QUOTE_SELECTED':
      return 'Quote Selected';
    case 'ORDER_CLOSED':
      return 'Order Closed';
    default:
      return 'Notification';
  }
};

// Helper: extract order reference from message text
const extractOrderFromMessage = (message) => {
  if (!message) return null;
  const orderPatterns = [
    /order\s+"([^"]+)"/i,
    /order\s+([A-Z0-9-]+)/i,
    /order\s+#(\d+)/i,
    /#([A-Z0-9-]+)/i,
    /([A-Z]{2,4}-\d+)/i,
  ];
  for (const pattern of orderPatterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// 🧠 Format time without "about" or "ago"
const formatCleanTime = (date) => {
  const formatted = formatDistanceToNow(new Date(date), { addSuffix: false });
  return formatted.replace(/^about\s/, '').trim();
};

const NotificationItem = ({ notification, onMarkAsRead, onClick }) => {
  const isReadByUser = notification.is_read_by_user;
  const content = getNotificationContent(notification);

  const handleMarkAsRead = async (e) => {
    e.stopPropagation();
    try {
      await onMarkAsRead(notification.id);
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  return (
    <div
      className={`group cursor-pointer relative rounded-lg px-1 py-2 transition-colors ${
        isReadByUser
          ? 'hover:bg-accent/50'
          : 'bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/10 hover:ring-primary/20'
      }`}
      onClick={() => onClick?.(notification)}
      role="button"
      tabIndex={0}
    >
      {/* Top-right timestamp so message can use full width below */}
      <div className="absolute top-3 right-2 text-xs text-muted-foreground">
        {formatCleanTime(notification.created_at)}
      </div>

      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <div className="h-9 w-9 rounded-full bg-muted/60 dark:bg-muted/30 flex items-center justify-center text-foreground/80 ring-1 ring-border">
            <NotificationIcon type={notification.type} />
          </div>
        </div>

        <div className="w-full">
          {/* Title row (reserve space so it doesn't overlap timestamp) */}
          <div className="flex items-center gap-2 pr-16">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            <h4 className="truncate font-medium text-sm leading-tight text-foreground">{content.title}</h4>
            {!isReadByUser && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary/70" />}
          </div>

          {/* Plain message, no emphasis, full width under title */}
          <p className="mt-2 text-xs text-muted-foreground break-words leading-relaxed">
            {content.message}
          </p>

          <div className="mt-2 flex items-center justify-end gap-1">
            {!isReadByUser && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10 dark:hover:bg-primary/20"
                onClick={handleMarkAsRead}
                title="Mark as read"
              >
                <Check className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationPanel = () => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [companyType, setCompanyType] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchUserRole = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const userData = await response.json();
        const role = userData.role;
        const companyType = userData.companyType;
        setUserRole(role);
        setCompanyType(companyType);
        setIsAdmin(role === 'ADMIN');
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  }, [user?.id]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/company-wide?limit=50');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch('/api/notifications/company-wide/unread');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [user?.id]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/company-wide/${notificationId}`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read_by_user: true, read_count: (n.read_count || 0) + 1 } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      throw error;
    }
  };

  const markAllAsRead = async () => {
    setBulkLoading(true);
    try {
      const response = await fetch('/api/notifications/company-wide/mark-all-read', {
        method: 'PATCH',
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read_by_user: true, read_count: (n.read_count || 0) + 1 }))
        );
        setUnreadCount(0);
        toast.success(`Marked ${data.count} notifications as read`);
      } else {
        toast.error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all notifications as read');
    } finally {
      setBulkLoading(false);
    }
  };

  const emptyNotifications = async () => {
    if (!isAdmin) {
      toast.error('Only company admins can empty notifications');
      return;
    }
    setBulkLoading(true);
    try {
      const response = await fetch('/api/notifications/company-wide/empty', {
        method: 'DELETE',
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications([]);
        setUnreadCount(0);
        toast.success(`Deleted ${data.count} notifications`);
      } else {
        toast.error('Failed to empty notifications');
      }
    } catch (error) {
      console.error('Failed to empty notifications:', error);
      toast.error('Failed to empty notifications');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    const { order_id, quote_id } = notification;

    if (order_id) {
      let orderPath;
      if (companyType === 'FREIGHT_FORWARDER') {
        orderPath = `/forwarders/orders/${order_id}`;
      } else if (companyType === 'EXPORTER') {
        orderPath = `/orders/${order_id}`;
      } else {
        orderPath = `/orders/${order_id}`;
      }
      window.location.href = orderPath;
    } else if (quote_id && !order_id) {
      if (companyType === 'FREIGHT_FORWARDER') {
        window.location.href = '/forwarders/dashboard';
      } else {
        window.location.href = '/dashboard';
      }
    }

    if (!notification.is_read_by_user) {
      markAsRead(notification.id);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserRole();
      fetchUnreadCount();
      if (isOpen) {
        fetchNotifications();
      }
    }
  }, [user?.id, isOpen, fetchNotifications, fetchUnreadCount, fetchUserRole]);

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id, fetchUnreadCount]);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchNotifications();
    }
  }, [isOpen, user?.id, fetchNotifications]);

  if (!user) return null;

  const hasUnreadNotifications = notifications.some((n) => !n.is_read_by_user);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[500px] sm:w-[540px] flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              Notifications
              {unreadCount > 0 && <Badge variant="secondary">{unreadCount} unread</Badge>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              title="Refresh"
              aria-label="Refresh notifications"
              onClick={fetchNotifications}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex-1 flex flex-col min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
              <div className="p-4 rounded-full bg-muted/50 dark:bg-muted/20 mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                You&apos;re all caught up! New notifications will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Scroll the sheet body (no extra box), with separators between items */}
              <div className="flex-1 overflow-y-auto px-2">
                {notifications.map((notification, idx) => (
                  <React.Fragment key={notification.id}>
                    <NotificationItem
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onClick={handleNotificationClick}
                    />
                    {idx < notifications.length - 1 && <Separator className="my-1.5" />}
                  </React.Fragment>
                ))}
              </div>

              {/* Footer: only two bulk actions */}
              <div className="pt-4 mt-4">
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={bulkLoading || !hasUnreadNotifications}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark All as Read
                  </Button>

                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={emptyNotifications}
                      disabled={bulkLoading || notifications.length === 0}
                      className="flex-1 border-destructive/30 text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Empty Notifications
                    </Button>
                  )}
                </div>

                {bulkLoading && (
                  <div className="mt-3 flex items-center justify-center py-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Processing...</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationPanel;