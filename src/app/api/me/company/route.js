 import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
      .eq('id', user.id)
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


