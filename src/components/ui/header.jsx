'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Search, CircleUser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { exporterConfig, forwarderConfig } from '@/config/dashboard'
import { logout } from '@/app/auth/actions'
import { ThemeModeToggle } from '@/components/ThemeModeToggle'

const Header = ({ userType = 'EXPORTER' }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  
  // Select the appropriate config based on userType
  const config = userType === 'FREIGHT_FORWARDER' ? forwarderConfig : exporterConfig

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      // The server action will handle the redirect, but we can also do it here as a fallback
      router.push('/auth/signin')
    } catch (error) {
      console.error('Logout failed:', error)
      // Handle error (e.g., show a notification to the user)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
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
        <form>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
            />
          </div>
        </form>
      </div>
      <nav className="hidden gap-4 md:flex">
        {config.mainNav.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={`text-sm font-medium ${item.disabled ? 'cursor-not-allowed opacity-80' : 'hover:text-foreground'}`}
          >
            {item.title}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
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