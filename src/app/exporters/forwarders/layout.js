import React from 'react'
import Sidebar from '@/components/ui/sidebar'
import Header from '@/components/ui/header'
import { getUserCompanyMembership } from '@/data-access/companies'
import { getCurrentUser } from '@/data-access/users'
import { redirect } from 'next/navigation'

const ForwardersLayout = async ({ children }) => {
  // Get authenticated user
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }
  
  // Get user's company membership to determine user type
  const companyMembership = await getUserCompanyMembership(user.id);
  const companyType = companyMembership?.companies?.type;
  
  // Determine userType for sidebar and header
  const userType = companyType === 'FREIGHT_FORWARDER' ? 'FREIGHT_FORWARDER' : 'EXPORTER';

  return (
    <div className="h-screen w-full overflow-hidden grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar userType={userType} />
      <div className="flex flex-col h-full overflow-hidden">
        <Header userType={userType} />
        <main className="flex-1 overflow-hidden p-4 lg:p-6">
          <div className="h-full overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default ForwardersLayout 