'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useClerk, useUser, useAuth } from '@clerk/nextjs'
import { Menu, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { exporterConfig, forwarderConfig } from '@/config/dashboard'
import { ThemeModeToggle } from '@/components/ThemeModeToggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import NotificationPanel from '@/components/notifications/NotificationPanel'

const Header = ({ userType = 'EXPORTER' }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [companyMembership, setCompanyMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useClerk()
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const fetchedUserIdRef = useRef(null) // Track which user we've fetched data for
  
  // Select the appropriate config based on userType
  const config = userType === 'FREIGHT_FORWARDER' ? forwarderConfig : exporterConfig

  // Fetch user's company information
  useEffect(() => {
    if (!isLoaded || !user) return
    
    // Don't refetch if we already have the data for this user
    if (fetchedUserIdRef.current === user.id && companyMembership) return

    const fetchUserData = async () => {
      try {
        // Only show loading on initial fetch, not on refetches
        if (!companyMembership) {
          setLoading(true)
        }
        
        // Get Clerk JWT token for Supabase RLS - skip cache to ensure fresh token
        const supabaseToken = await getToken({ template: 'supabase', skipCache: true })
        const supabase = createClient(supabaseToken)

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
          // Don't clear existing data on error
          return
        }

        // Only update if we got valid data
        if (companyData) {
          setCompanyMembership(companyData)
          fetchedUserIdRef.current = user.id // Mark this user as fetched
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        // Don't clear existing data on error
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [isLoaded, user?.id, getToken]) // Removed pathname from dependencies to prevent refetch on navigation

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
    setIsNavigating(true)
    router.push('/profile?tab=personal')
  }

  const handleNavigation = (href) => {
    setIsNavigating(true)
    router.push(href)
    // The loading state will be reset when navigation completes or component unmounts
  }

  // Reset navigation state when pathname changes (navigation completed)
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

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
              <Link
                key={index}
                href={item.href}
                onClick={() => setIsNavigating(true)}
                className="flex items-center gap-2 text-lg font-medium hover:text-foreground transition-colors"
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                {item.title}
              </Link>
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
                onClick={() => handleNavigation(item.href)}
                className="text-sm font-medium min-w-[120px]"
                disabled={item.disabled || isNavigating}
              >
                {isNavigating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  item.title
                )}
              </Button>
            )
          }
          
          // Render other items as regular links
          return (
            <Link
              key={index}
              href={item.href}
              onClick={() => setIsNavigating(true)}
              className={`text-sm font-medium ${item.disabled ? 'cursor-not-allowed opacity-80' : 'hover:text-foreground transition-colors'}`}
            >
              {item.title}
            </Link>
          )
        })}
      </nav>
      <div className="flex items-center gap-2">
        {/* Notifications Panel */}
        <NotificationPanel />
        
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