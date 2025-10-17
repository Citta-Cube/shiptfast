import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { markNotificationAsRead } from '@/data-access/notifications';

export async function PATCH(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    const result = await markNotificationAsRead(id, userId);
    
    if (result) {
      return NextResponse.json({ message: 'Notification marked as read' });
    } else {
      return NextResponse.json({ message: 'Notification was already read' });
    }
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}