import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { markNotificationAsRead, deleteNotification } from '@/data-access/notifications';

export async function PATCH(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const notificationId = params.id;
    
    const result = await markNotificationAsRead(notificationId, userId);
    
    if (result) {
      return NextResponse.json({ message: 'Notification marked as read' });
    } else {
      return NextResponse.json({ message: 'Notification was already read' });
    }
    
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const notificationId = params.id;
    await deleteNotification(notificationId, userId);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}