"use client";

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { Package2, Bell, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exporterConfig, forwarderConfig } from '@/config/dashboard'
import SidebarLink from '@/components/ui/sidebar-link'
import { cn } from '@/lib/utils'

const Sidebar = ({ userType = 'EXPORTER' }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useClerk()

  // Select the appropriate config based on userType
  const config = userType === 'FREIGHT_FORWARDER' ? forwarderConfig : exporterConfig
  
  // Determine dashboard href based on user type
  const dashboardHref = userType === 'FREIGHT_FORWARDER' ? '/forwarders/dashboard' : '/dashboard'
  
  // Check if we're on the dashboard page (for logo link highlighting)
  const isDashboardActive = pathname === dashboardHref || pathname.startsWith(dashboardHref + '?')

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

  return (
    <div className="hidden border-r md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[80px] lg:px-6">
          <Link 
            href={dashboardHref} 
            className={cn(
              "flex items-center gap-2 font-semibold transition-colors",
              isDashboardActive ? "text-primary" : "hover:text-primary"
            )}
          >
            <Package2 className="h-6 w-6" />
            <span className="">SHIPTFAST</span>
          </Link>
          <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </div>
        
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mt-4">
            {config.sidebarNav.map((item, index) => (
              <SidebarLink key={index} item={item} />
            ))}
          </nav>
        </div>

        {/* Logout button at the bottom */}
        <div className="mt-auto border-t p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted" 
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar