import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getForwarderMetrics } from '@/data-access/forwarderOrders';
import { getCurrentUser } from '@/data-access/users';
import { getUserCompanyMembership } from '@/data-access/companies';

export async function GET() {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company membership
    const membership = await getUserCompanyMembership(user.id);
    
    if (!membership?.companies?.type || membership.companies.type !== 'FREIGHT_FORWARDER') {
      return NextResponse.json({ error: 'Access forbidden. Only freight forwarders can access metrics.' }, { status: 403 });
    }

    const forwarderId = membership.companies.id;
    const metrics = await getForwarderMetrics(forwarderId);
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching forwarder metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch forwarder metrics' }, { status: 500 });
  }
} 