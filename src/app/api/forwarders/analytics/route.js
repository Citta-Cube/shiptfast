import { NextResponse } from 'next/server';
import { getForwarderAnalytics } from '@/data-access/forwarderAnalytics';
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
      return NextResponse.json(
        { error: 'Access forbidden. Only freight forwarders can access analytics.' },
        { status: 403 }
      );
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Validate time range
    const validRanges = ['7d', '30d', '90d', '1y', 'all'];
    if (!validRanges.includes(timeRange)) {
      return NextResponse.json(
        { error: 'Invalid time range. Must be one of: 7d, 30d, 90d, 1y, all' },
        { status: 400 }
      );
    }

    const forwarderId = membership.companies.id;
    const analytics = await getForwarderAnalytics(forwarderId, timeRange);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching forwarder analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
