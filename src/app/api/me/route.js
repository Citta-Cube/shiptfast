import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserCompanyMembership } from '@/data-access/companies';

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's company membership and role
    const membership = await getUserCompanyMembership(userId);
    
    if (!membership) {
      return NextResponse.json({ error: 'User company membership not found' }, { status: 400 });
    }
    
    return NextResponse.json({
      userId,
      role: membership.role,
      companyId: membership.companies?.id,
      companyName: membership.companies?.name,
      companyType: membership.companies?.type,
      firstName: membership.first_name,
      lastName: membership.last_name,
      jobTitle: membership.job_title
    });
    
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    );
  }
}