'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClerk, useUser } from '@clerk/nextjs'
import { Menu, CircleUser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { exporterConfig, forwarderConfig } from '@/config/dashboard'
import { ThemeModeToggle } from '@/components/ThemeModeToggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const Header = ({ userType = 'EXPORTER' }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const { signOut } = useClerk()
  const { user } = useUser()
  
  // Select the appropriate config based on userType
  const config = userType === 'FREIGHT_FORWARDER' ? forwarderConfig : exporterConfig

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

  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              {user?.imageUrl ? (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              ) : (
                <CircleUser className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.fullName || user?.emailAddresses[0]?.emailAddress}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push('/profile')}>
              User Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push('/support')}>
              Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeModeToggle />
      </div>
    </header>
  )
}

export default Header