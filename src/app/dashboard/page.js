// @/app/dashboard/page.js
import { redirect } from 'next/navigation';
import { getUserCompanyMembership } from '@/data-access/companies';
import { getCurrentUser } from '@/data-access/users';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }) {
  // Get authenticated user
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }
  
  // Get user's company membership with company details using data access layer
  const companyMembership = await getUserCompanyMembership(user.id);
    
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