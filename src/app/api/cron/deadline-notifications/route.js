import { NextResponse } from 'next/server';
import { createDeadlineNotifications } from '@/data-access/notifications';

export async function POST(request) {
  try {
    // Verify the request is coming from a cron job or authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await createDeadlineNotifications();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Deadline notifications check completed' 
    });
    
  } catch (error) {
    console.error('Error in deadline notifications cron:', error);
    return NextResponse.json(
      { error: 'Failed to check deadline notifications' },
      { status: 500 }
    );
  }
}