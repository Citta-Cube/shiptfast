'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { getUserCompanyMembership } from '@/data-access/companies'

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-opacity-75 z-50">
    <Card className="w-64">
      <CardContent className="flex flex-col items-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-gray-600">Verifying access...</p>
      </CardContent>
    </Card>
  </div>
)

const RoleBasedAccess = ({ children, allowedCompanyTypes }) => {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoaded) return

      if (!user) {
        router.push('/auth/signin')
        return
      }

      try {
        const companyMembership = await getUserCompanyMembership(user.id)
        const userCompanyType = companyMembership?.companies?.type

        if (!userCompanyType || !allowedCompanyTypes.includes(userCompanyType)) {
          router.push('/unauthorized')
          return
        }

        setHasAccess(true)
      } catch (error) {
        console.error('Error checking access:', error)
        router.push('/unauthorized')
      } finally {
        setIsChecking(false)
      }
    }

    checkAccess()
  }, [user, isLoaded, allowedCompanyTypes, router])

  if (!isLoaded || isChecking) {
    return <LoadingSpinner />
  }

  if (!hasAccess) {
    return null
  }

  return children
}

export default RoleBasedAccess