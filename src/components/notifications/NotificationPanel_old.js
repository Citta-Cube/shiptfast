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
  
  return (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-accent/50 ${
        !notification.is_read ? 'border-primary/20 bg-primary/5' : ''
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
                  {!notification.is_read && (
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
                {notification.sender_company && (
                  <>
                    <span>•</span>
                    <span>from {notification.sender_company.name}</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {!notification.is_read && (
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
      const response = await fetch('/api/notifications?limit=50');
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
      const response = await fetch('/api/notifications/unread');
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
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read' })
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
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
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleNotificationClick = (notification) => {
    // Navigate to relevant page based on notification type
    if (notification.order_id) {
      window.location.href = `/orders/${notification.order_id}`;
    }
    
    // Mark as read if not already read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, user?.id]);

  if (!user) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-destructive hover:bg-destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[500px] flex flex-col">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {notifications.some(n => !n.is_read) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <div className="flex-1 mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <h3 className="font-medium text-muted-foreground">No notifications</h3>
              <p className="text-sm text-muted-foreground/80">
                You're all caught up!
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-3">
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
      </SheetContent>
    </Sheet>
  );
};

export default NotificationPanel;