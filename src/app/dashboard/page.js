// @/app/dashboard/page.js
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage({ searchParams }) {
  const supabase = createClient();
  
  // Get user and their role
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/signin');
  }
  
  // Get user's company membership with company details
  const { data: companyMembership } = await supabase
    .from('company_members')
    .select(`
      id,
      companies:company_id (
        id,
        type
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
    
  // Determine which dashboard to show based on company type
  if (!companyMembership?.companies?.type) {
    // If no company type is found, redirect to a default dashboard or error page
    redirect('/account-setup');
  }
  
  const companyType = companyMembership.companies.type;
  
  if (companyType === 'FREIGHT_FORWARDER') {
    redirect(`/forwarders/dashboard?${new URLSearchParams(searchParams).toString()}`);
  } else if (companyType === 'EXPORTER') {
    redirect(`/exporters/dashboard?${new URLSearchParams(searchParams).toString()}`);
  } else {
    // Handle any other company types as needed
    redirect(`/exporters/dashboard?${new URLSearchParams(searchParams).toString()}`);
  }
}