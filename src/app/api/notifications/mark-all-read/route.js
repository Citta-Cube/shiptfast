import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { markAllNotificationsAsRead } from '@/data-access/notifications';

export async function PATCH(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const notifications = await markAllNotificationsAsRead(userId);
    
    return NextResponse.json({ 
      success: true, 
      count: notifications?.length || 0 
    });
    
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}