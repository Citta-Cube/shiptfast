'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from './logo'
import { Menu, X, Moon, Sun, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'

const menuItems = [
  { name: 'Features', href: '#features', homeOnly: true },
  { name: 'FAQ', href: '#faq', homeOnly: true },
  { name: 'Pricing', href: '#pricing', homeOnly: true },
  { name: 'Contact', href: '#contact', homeOnly: true },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="h-10 w-10"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export const HeroHeader = ({ isAuthenticated: isAuthenticatedProp }) => {
  const [menuState, setMenuState] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(
    typeof isAuthenticatedProp === 'boolean' ? false : true
  )
  const [dashboardLoading, setDashboardLoading] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const supabase = createClient()

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  React.useEffect(() => {
    // If auth state is provided from server, don't attach client listeners
    if (typeof isAuthenticatedProp === 'boolean') {
      setUser(isAuthenticatedProp ? { id: 'server-auth' } : null)
      setLoading(false)
      return
    }

    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [supabase.auth, isAuthenticatedProp])

  React.useEffect(() => {
    setDashboardLoading(false)
    setMenuState(false)
  }, [pathname])

  const handleDashboardClick = () => {
    setDashboardLoading(true)
    router.push('/dashboard')
  }

  const isAuthenticated = typeof isAuthenticatedProp === 'boolean'
    ? isAuthenticatedProp
    : !!user
  const isHomePage = pathname === '/'

  const getHref = (item) => {
    if (item.homeOnly && !isHomePage) {
      return `/${item.href.replace(/^#/, '')}`
    }
    return item.href
  }

  return (
    <header className="relative">
      <nav data-state={menuState ? 'active' : ''} className="fixed z-50 w-full px-2">
        <div className={cn('mx-auto mt-2 max-w-6xl px-4 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/80 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
          <div className="relative flex items-center justify-between py-3 lg:py-4">
            
            {/* Left Section - Quick Links (Desktop Only) */}
            <div className="hidden lg:flex items-center">
              <ul className="flex gap-6 text-md">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <Link href={getHref(item)} className="text-muted-foreground hover:text-accent-foreground block duration-150 py-2 px-1">
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Center Section - Logo */}
            <div className="flex items-center lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2">
              <Link href="/" aria-label="home" className="flex items-center space-x-2">
                <Logo className="h-8 w-auto" />
              </Link>
            </div>

            {/* Right Section - Theme Toggle & Auth Buttons */}
            <div className="flex items-center gap-2 lg:gap-4">
              <ThemeToggle />
              
              {/* Desktop Auth Buttons */}
              <div className="hidden lg:flex items-center gap-4">
                {loading ? (
                  <div className="h-9 w-24 animate-pulse rounded bg-muted" />
                ) : isAuthenticated ? (
                  <Button size="sm" onClick={handleDashboardClick} disabled={dashboardLoading}>
                    {dashboardLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Dashboard</span>
                      </>
                    ) : (
                      <span>Dashboard</span>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/auth/signin">
                        <span>Login</span>
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href="/#contact">
                        <span>Get Started</span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                className="relative z-20 p-2.5 rounded-md hover:bg-accent transition-colors lg:hidden"
              >
                {menuState ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Mobile Menu */}
            <div className={cn('fixed inset-0 top-0 left-0 w-full h-screen bg-background/95 backdrop-blur-sm transition-all duration-300 transform lg:hidden', menuState ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none')}>
              <div className="flex flex-col h-full pt-20 pb-8 px-6 overflow-y-auto">
                <button onClick={() => setMenuState(false)} className="absolute top-6 right-4 p-2 rounded-md hover:bg-accent" aria-label="Close menu">
                  <X className="h-6 w-6" />
                </button>

                <ul className="space-y-6 text-lg font-medium">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link href={getHref(item)} className="text-foreground py-3 block border-b border-border" onClick={() => setMenuState(false)}>
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-8 border-t border-border">
                  {loading ? (
                    <div className="h-12 w-full animate-pulse rounded bg-muted" />
                  ) : isAuthenticated ? (
                    <Button size="lg" onClick={handleDashboardClick} disabled={dashboardLoading} className="w-full">
                      {dashboardLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          <span>Going to Dashboard</span>
                        </>
                      ) : (
                        <span>Go to Dashboard</span>
                      )}
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <Button asChild variant="outline" size="lg" className="w-full">
                        <Link href="/auth/signin" onClick={() => setMenuState(false)}>
                          <span>Login</span>
                        </Link>
                      </Button>
                      <Button asChild size="lg" className="w-full">
                        <Link href="/#contact" onClick={() => setMenuState(false)}>
                          <span>Get Started</span>
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* spacer to avoid content under fixed header */}
      <div className="h-16 lg:h-20" />
    </header>
  )
}

export default HeroHeader