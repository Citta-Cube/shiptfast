import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserNotifications } from '@/data-access/notifications';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
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
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    
    const notifications = await getUserNotifications(userId, userCompany.company_id, limit);
    
    return NextResponse.json({ notifications });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}