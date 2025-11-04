'use client'

import React, { useEffect, useState } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/ui/sidebar'
import Header from '@/components/ui/header'

const DashboardLayout = ({ children }) => {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [userType, setUserType] = useState('EXPORTER')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !user) return

    const fetchUserType = async () => {
      try {
        // Get Clerk JWT token for Supabase RLS
        const supabaseToken = await getToken({ template: 'supabase' })
        const supabase = createClient(supabaseToken)
        
        // Fetch user's company information to determine user type
        const { data: companyData, error: companyError } = await supabase
          .from('company_members')
          .select(`
            companies:company_id (
              type
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        if (companyError && companyError.code !== 'PGRST116') {
          console.error('Error fetching company data:', companyError)
        }

        // Set user type based on company type
        if (companyData?.companies?.type) {
          setUserType(companyData.companies.type)
        }
      } catch (error) {
        console.error('Error fetching user type:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserType()
  }, [isLoaded, user, getToken])

  if (!isLoaded || loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

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

export default DashboardLayout