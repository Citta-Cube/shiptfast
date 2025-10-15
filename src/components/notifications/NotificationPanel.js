'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Bell, Check, X, MessageSquare, Package, FileText, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

const NotificationIcon = ({ type }) => {
  const iconProps = { className: "w-4 h-4" };
  
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

const NotificationBadgeColor = ({ type }) => {
  switch (type) {
    case 'ORDER_DUE_24_HOURS':
      return 'destructive';
    case 'ORDER_DUE_7_DAYS':
      return 'secondary';
    case 'QUOTE_SELECTED':
      return 'default';
    case 'ORDER_CREATED':
    case 'QUOTE_RECEIVED':
      return 'secondary';
    default:
      return 'outline';
  }
};

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  onClick 
}) => {
  const handleMarkAsRead = async (e) => {
    e.stopPropagation();
    try {
      await onMarkAsRead(notification.id);
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      await onDelete(notification.id);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const isUrgent = notification.type === 'ORDER_DUE_24_HOURS';
  const isReadByUser = notification.is_read_by_user;
  
  return (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-accent/50 ${
        !isReadByUser ? 'border-primary/20 bg-primary/5' : ''
      } ${isUrgent ? 'border-destructive/30 bg-destructive/5' : ''}`}
      onClick={() => onClick?.(notification)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${
            isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}>
            <NotificationIcon type={notification.type} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm leading-tight">
                  {notification.title}
                  {!isReadByUser && (
                    <Badge className="ml-2 h-2 w-2 p-0 bg-primary" />
                  )}
                </h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {notification.message}
                </p>
              </div>
              
              <Badge variant={NotificationBadgeColor({ type: notification.type })} className="text-xs shrink-0">
                {notification.type.replace(/_/g, ' ').toLowerCase()}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
                {notification.read_count > 0 && (
                  <>
                    <span>•</span>
                    <span>{notification.read_count} read</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {!isReadByUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleMarkAsRead}
                    title="Mark as read"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                  title="Delete notification"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const NotificationPanel = () => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
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
  };

  const fetchUnreadCount = async () => {
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
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/company-wide/${notificationId}`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        // Update the notification to show as read by current user
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, is_read_by_user: true, read_count: n.read_count + 1 }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      throw error;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/company-wide/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.is_read_by_user) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const handleNotificationClick = (notification) => {
    // Navigate to relevant page based on notification type
    const { type, order_id, quote_id, message_id } = notification;
    
    if (order_id) {
      window.location.href = `/orders/${order_id}`;
    } else if (quote_id) {
      window.location.href = `/quotes/${quote_id}`;
    }
    
    // Mark as read when clicked
    if (!notification.is_read_by_user) {
      markAsRead(notification.id);
    }
  };

  // Initial load
  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount(); // Always fetch unread count
      if (isOpen) {
        fetchNotifications(); // Only fetch all notifications when panel is open
      }
    }
  }, [user?.id, isOpen]);

  // Auto-refresh unread count every 30 seconds
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Refresh notifications when panel is opened
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchNotifications();
    }
  }, [isOpen, user?.id]);

  if (!user) {
    return null;
  }

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
      
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Company Notifications
            </div>
            {unreadCount > 0 && (
              <Badge variant="secondary">
                {unreadCount} unread
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No notifications
              </h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{notifications.length} total notifications</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNotifications}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default NotificationPanel;