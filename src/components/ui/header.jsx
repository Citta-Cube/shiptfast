'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useClerk, useUser } from '@clerk/nextjs'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { exporterConfig, forwarderConfig } from '@/config/dashboard'
import { ThemeModeToggle } from '@/components/ThemeModeToggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

const Header = ({ userType = 'EXPORTER' }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [companyMembership, setCompanyMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { signOut } = useClerk()
  const { user, isLoaded } = useUser()
  
  // Select the appropriate config based on userType
  const config = userType === 'FREIGHT_FORWARDER' ? forwarderConfig : exporterConfig

  // Fetch user's company information
  useEffect(() => {
    if (!isLoaded || !user) return

    const fetchUserData = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Fetch user's company information
        const { data: companyData, error: companyError } = await supabase
          .from('company_members')
          .select(`
            id,
            job_title,
            role,
            is_active,
            first_name,
            last_name,
            companies:company_id (
              id,
              name,
              website,
              email,
              phone,
              address,
              description,
              type,
              business_registration_number,
              vat_number,
              created_at,
              is_verified,
              average_rating
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        if (companyError && companyError.code !== 'PGRST116') {
          console.error('Error fetching company data:', companyError)
        }

        setCompanyMembership(companyData)
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [isLoaded, user])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleProfileClick = () => {
    router.push('/profile?tab=personal')
  }

  // Get user's first name and last name
  const firstName = user?.firstName || companyMembership?.first_name || ''
  const lastName = user?.lastName || companyMembership?.last_name || ''
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : user?.emailAddresses[0]?.emailAddress?.split('@')[0] || ''
  
  // Get company name
  const companyName = companyMembership?.companies?.name || ''

  const userInitials = firstName && lastName 
    ? `${firstName[0]}${lastName[0]}` 
    : user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() || '?'

  return (
    <header className="flex h-14 items-center gap-4 border-b px-4 lg:h-[80px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <nav className="flex flex-col gap-4">
            {config.sidebarNav.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="flex items-center gap-2 text-lg font-medium"
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                {item.title}
              </a>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        
      </div>
      <nav className="hidden gap-4 md:flex md:items-center">
        {config.mainNav.map((item, index) => {
          // Render the first item as a button
          if (index === 0) {
            return (
              <Button
                key={index}
                onClick={() => router.push(item.href)}
                className="text-sm font-medium"
                disabled={item.disabled}
              >
                {item.title}
              </Button>
            )
          }
          
          // Render other items as regular links
          return (
            <a
              key={index}
              href={item.href}
              className={`text-sm font-medium ${item.disabled ? 'cursor-not-allowed opacity-80' : 'hover:text-foreground'}`}
            >
              {item.title}
            </a>
          )
        })}
      </nav>
      <div className="flex items-center gap-2">
        {/* User Profile Section - Click to navigate to profile */}
        <div 
          onClick={handleProfileClick}
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl} alt={fullName || 'User'} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col">
            <div className="text-sm font-medium text-foreground">
              {fullName}
            </div>
            {companyName && (
              <div className="text-xs text-muted-foreground">
                {companyName}
              </div>
            )}
          </div>
        </div>
        
        <ThemeModeToggle />
      </div>
    </header>
  )
}

export default Header