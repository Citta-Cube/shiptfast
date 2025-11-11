import { mockFreightForwarderDetail } from '@/mockData/freightForwarderDetail';
import { NextResponse } from 'next/server';
import { getForwarderById } from '@/data-access/freightForwarders';
import { auth } from '@clerk/nextjs/server';
import { getUserCompanyMembership } from '@/data-access/companies';

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's company membership to get exporterId
    const membership = await getUserCompanyMembership(userId);
    
    if (!membership || !membership.companies) {
      return NextResponse.json(
        { error: 'User company membership not found' },
        { status: 400 }
      );
    }

    const exporterId = membership.companies.id;
    const { id } = params;
    const forwarder = await getForwarderById(id, exporterId);

    return NextResponse.json(forwarder);
  } catch (error) {
    console.error('Error fetching freight forwarder:', error);
    return NextResponse.json(
      { error: 'Failed to fetch freight forwarder' },
      { status: 500 }
    );
  }
}