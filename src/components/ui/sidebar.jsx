"use client";

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package2, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { dashboardConfig } from '@/config/dashboard'
import SidebarLink from '@/components/ui/sidebar-link'

const Sidebar = () => {
  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
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
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                {dashboardConfig.sidebarNav.map((item, index) => (
                    <SidebarLink key={index} item={item} />
                ))}
            </nav>
        </div>
      </div>
    </div>
  )
}

export default Sidebar