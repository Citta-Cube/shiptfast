import { NextResponse } from 'next/server';
import { getCompanyRatings } from '@/data-access/companies';

export async function GET(request, { params }) {
  try {
    const { id: companyId } = params;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const ratings = await getCompanyRatings(companyId);

    return NextResponse.json({ ratings });

  } catch (error) {
    console.error('Error fetching company ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

