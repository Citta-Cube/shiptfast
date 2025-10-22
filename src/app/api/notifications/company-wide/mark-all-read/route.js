import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { markAllNotificationsAsRead } from '@/data-access/notifications';

export async function PATCH(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use the existing function from notifications data access
    const results = await markAllNotificationsAsRead(userId);
    
    return NextResponse.json({ 
      count: results.length,
      message: `Marked ${results.length} notifications as read`
    });
    
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}