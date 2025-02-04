// src/components/layout/SidebarLink.tsx
"use client";

import React, { useState } from 'react'
import Link from 'next/link'
import { useActiveLink } from '@/hooks/useActiveLink'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

const SidebarLink = ({ item }) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(true)
  const isActive = useActiveLink(item.href)
  const hasSubmenu = item.submenu && item.submenu.length > 0

  const toggleSubmenu = (e) => {
    if (hasSubmenu) {
      e.preventDefault()
      setIsSubmenuOpen(!isSubmenuOpen)
    }
  }

  return (
    <div className="w-full">
      <Link
        href={item.href}
        onClick={toggleSubmenu}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-foreground",
          isActive ? 'bg-primary text-white' : 'text-muted-foreground',
          hasSubmenu && 'cursor-pointer'
        )}
      >
        {item.icon && <item.icon className="h-4 w-4" />}
        <span className="flex-1">{item.title}</span>
        {item.badge && (
          <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
            {item.badge}
          </Badge>
        )}
        {hasSubmenu && (
          <div className="ml-auto">
            {isSubmenuOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        )}
      </Link>

      {hasSubmenu && isSubmenuOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {item.submenu.map((submenuGroup, groupIndex) => (
            <div key={groupIndex} className="mb-2">
              <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
                {submenuGroup.title}
              </div>
              {submenuGroup.items.map((subItem, index) => (
                <Link
                  key={index}
                  href={subItem.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-foreground",
                    useActiveLink(subItem.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                  )}
                >
                  {subItem.icon && <subItem.icon className="h-4 w-4" />}
                  <span>{subItem.title}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SidebarLink