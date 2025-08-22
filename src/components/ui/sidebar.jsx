"use client";

import Link from 'next/link'
import { Package2, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exporterConfig, forwarderConfig } from '@/config/dashboard'
import SidebarLink from '@/components/ui/sidebar-link'

const Sidebar = ({ userType = 'EXPORTER' }) => {
  // Select the appropriate config based on userType
  const config = userType === 'FREIGHT_FORWARDER' ? forwarderConfig : exporterConfig

  return (
    <div className="hidden border-r  md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[80px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
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

        {/* <div className="mt-auto border-t">
          <div className="flex items-center gap-3 p-4">
            <Avatar>
              <AvatarImage src={session?.user?.image} alt={"Charaka Abeywickrama"} />
              <AvatarFallback>{session?.user?.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{"Charaka Abeywickrama" || session?.user?.email}</span>
              <span className="text-xs text-muted-foreground">{session?.user?.email}</span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </div>
        </div> */}
      </div>
    </div>
  )
}

export default Sidebar