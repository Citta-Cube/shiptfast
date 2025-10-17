import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUnreadNotificationsCount } from '@/data-access/notifications';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's company
    const supabase = createClient();
    const { data: userCompany, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .single();
    
    if (companyError || !userCompany) {
      return NextResponse.json({ error: 'User company not found' }, { status: 400 });
    }
    
    const unreadCount = await getUnreadNotificationsCount(userId, userCompany.company_id);
    
    return NextResponse.json({ count: unreadCount });
    
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}