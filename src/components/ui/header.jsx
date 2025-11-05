'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useClerk, useUser, useAuth } from '@clerk/nextjs'
import { Menu, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { exporterConfig, forwarderConfig } from '@/config/dashboard'
import { ThemeModeToggle } from '@/components/ThemeModeToggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import NotificationPanel from '@/components/notifications/NotificationPanel'
import { createClient } from '@/lib/supabase/client'

const Header = ({ userType = 'EXPORTER' }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [companyMembership, setCompanyMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)
  const [supabaseClient, setSupabaseClient] = useState(null)
  const [tokenVersion, setTokenVersion] = useState(0) // triggers data refresh

  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useClerk()
  const { user, isLoaded } = useUser()
  const { getToken, isSignedIn } = useAuth()
  const fetchedUserIdRef = useRef(null)

  const config = userType === 'FREIGHT_FORWARDER' ? forwarderConfig : exporterConfig

  // 🔹 Step 1: Create Supabase client that refreshes token periodically
  useEffect(() => {
    let active = true

    const initClient = async () => {
      if (!isSignedIn) return
      const token = await getToken({ template: 'supabase' })

      if (!token) {
        console.warn('⚠️ No Clerk token found')
        return
      }

      if (supabaseClient && typeof supabaseClient.setRlsToken === 'function') {
        supabaseClient.setRlsToken(token)
        if (active) setTokenVersion((v) => v + 1)
        console.log('🔄 Supabase token rotated at', new Date().toLocaleTimeString())
      } else {
        const client = createClient(token)
        if (active) {
          setSupabaseClient(client)
          setTokenVersion((v) => v + 1)
          console.log('✅ Supabase client initialized at', new Date().toLocaleTimeString())
        }
      }
    }

    initClient()
    const interval = setInterval(initClient, 50 * 1000) // Refresh before expiry

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [getToken, isSignedIn, supabaseClient])

  // 🔹 Step 2: Fetch user's company info whenever Supabase or token refreshes
  useEffect(() => {
    if (!isLoaded || !user || !supabaseClient) return
    if (fetchedUserIdRef.current === user.id && companyMembership) return

    const fetchUserData = async () => {
      try {
        if (!companyMembership) setLoading(true)

        const { data, error } = await supabaseClient
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

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Error fetching company data:', error)
          return
        }

        if (data) {
          console.log('🏢 Company membership fetched:', data)
          setCompanyMembership(data)
          fetchedUserIdRef.current = user.id
        }
      } catch (err) {
        console.error('❌ Error fetching user company info:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [isLoaded, user?.id, supabaseClient, tokenVersion])

  // 🔹 Logout
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      router.push('/')
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // 🔹 Navigation helpers
  const handleProfileClick = () => {
    setIsNavigating(true)
    router.push('/profile?tab=personal')
  }

  const handleNavigation = (href) => {
    setIsNavigating(true)
    router.push(href)
  }

  useEffect(() => setIsNavigating(false), [pathname])

  // 🔹 Display user info
  const firstName = user?.firstName || companyMembership?.first_name || ''
  const lastName = user?.lastName || companyMembership?.last_name || ''
  const fullName =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : user?.emailAddresses[0]?.emailAddress?.split('@')[0] || ''

  const companyName = companyMembership?.companies?.name || ''
  const userInitials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`
      : user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() || '?'

  // 🔹 UI
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

      <div className="w-full flex-1" />

      <nav className="hidden gap-4 md:flex md:items-center">
        {config.mainNav.map((item, index) =>
          index === 0 ? (
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
          ) : (
            <Link
              key={index}
              href={item.href}
              onClick={() => setIsNavigating(true)}
              className={`text-sm font-medium ${
                item.disabled
                  ? 'cursor-not-allowed opacity-80'
                  : 'hover:text-foreground transition-colors'
              }`}
            >
              {item.title}
            </Link>
          )
        )}
      </nav>

      <div className="flex items-center gap-2">
        <NotificationPanel />

        {/* User Profile */}
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
              {loading ? 'Loading...' : fullName}
            </div>
            {companyName && (
              <div className="text-xs text-muted-foreground">{companyName}</div>
            )}
          </div>
        </div>

        <ThemeModeToggle />
      </div>
    </header>
  )
}

export default Header
