import { NextResponse } from 'next/server';
import { getForwarderOrders } from '@/data-access/forwarderOrders';
import { getCurrentUser } from '@/data-access/users';
import { getUserCompanyMembership } from '@/data-access/companies';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company membership
    const membership = await getUserCompanyMembership(user.id);
    
    if (!membership?.companies?.type || membership.companies.type !== 'FREIGHT_FORWARDER') {
      return NextResponse.json({ error: 'Access forbidden. Only freight forwarders can access orders.' }, { status: 403 });
    }

    const forwarderId = membership.companies.id;
    
    // Get status filter from URL if provided
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const orders = await getForwarderOrders(forwarderId, status);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching forwarder orders:', error);
    return NextResponse.json({ error: 'Failed to fetch forwarder orders' }, { status: 500 });
  }
} 