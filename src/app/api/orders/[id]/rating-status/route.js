import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getUserCompanyMembership } from '@/data-access/companies';
import { getExistingRating } from '@/data-access/companies';

export async function GET(request, { params }) {
  try {
    const { id: orderId } = params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's company membership
    const membership = await getUserCompanyMembership(userId);
    if (!membership?.companies?.id) {
      return NextResponse.json(
        { error: 'User is not associated with any company' },
        { status: 403 }
      );
    }

    const raterCompanyId = membership.companies.id;

    // Check if rating exists
    const existingRating = await getExistingRating(orderId, raterCompanyId);

    return NextResponse.json({
      rating: existingRating
    });

  } catch (error) {
    console.error('Error checking rating status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
