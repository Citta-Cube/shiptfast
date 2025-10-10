 import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const supabase = createClient();

    // Check if user is authenticated
    const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

    const { data: membership, error } = await supabase
      .from('company_members')
      .select(`
        id,
        role,
        companies:company_id (
          id,
          type,
          metadata,
          country_code
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();


    if (error) throw error;
    if (!membership?.companies) {
      return NextResponse.json({ error: 'No active company' }, { status: 404 });
    }

    const company = membership.companies;
    const countryCode = company.country_code;

    return NextResponse.json({
      id: company.id,
      type: company.type,
      country_code: countryCode,
      role: membership.role || null,
    });
  } catch (err) {
    console.error('Error fetching current company:', err);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}


