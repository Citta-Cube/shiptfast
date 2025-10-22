import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = createClient();
    
    // Get user's company membership and check if they're an admin
    const { data: membership, error: membershipError } = await supabase
      .from('company_members')
      .select(`
        role,
        company_id,
        companies:company_id (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (membershipError || !membership) {
      return NextResponse.json({ error: 'User company membership not found' }, { status: 400 });
    }
    
    // Check if user is an admin
    if (membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only company admins can empty notifications' }, { status: 403 });
    }
    
    const companyId = membership.company_id;
    
    // Get count of notifications before deletion
    const { count: notificationCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_company_id', companyId);
    
    if (countError) {
      console.error('Error counting notifications:', countError);
      return NextResponse.json({ error: 'Failed to count notifications' }, { status: 500 });
    }
    
    // Delete all notifications for the company
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_company_id', companyId);
    
    if (deleteError) {
      console.error('Error deleting notifications:', deleteError);
      return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      count: notificationCount || 0,
      message: `Deleted ${notificationCount || 0} notifications`
    });
    
  } catch (error) {
    console.error('Error emptying notifications:', error);
    return NextResponse.json(
      { error: 'Failed to empty notifications' },
      { status: 500 }
    );
  }
}