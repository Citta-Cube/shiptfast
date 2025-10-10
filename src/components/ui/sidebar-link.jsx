"use client";

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

const SidebarLink = ({ item }) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Check if main item is active
  const isMainActive = () => {
    if (item.href === pathname) return true
    if (item.href.includes('?')) {
      const [basePath] = item.href.split('?')
      return basePath === pathname
    }
    return false
  }

  // Check if any submenu item is active
  const hasActiveSubmenu = () => {
    if (!item.submenu) return false
    
    return item.submenu.some(group => 
      group.items.some(subItem => {
        if (subItem.href === pathname) return true
        
        if (subItem.href.includes('?')) {
          const [basePath, queryString] = subItem.href.split('?')
          if (basePath === pathname) {
            // Check query parameters match
            const params = new URLSearchParams(queryString)
            for (const [key, value] of params.entries()) {
              if (searchParams.get(key) === value) return true
            }
          }
        }
        return false
      })
    )
  }

  const isActive = isMainActive()
  const hasActiveChild = hasActiveSubmenu()
  const shouldHighlight = isActive || hasActiveChild

  // Auto-open submenu if it has an active child or if main item is active
  useEffect(() => {
    if (hasActiveChild || isActive) {
      setIsSubmenuOpen(true)
    }
  }, [hasActiveChild, isActive, pathname, searchParams])

  const hasSubmenu = item.submenu && item.submenu.length > 0

  const toggleSubmenu = (e) => {
    if (hasSubmenu) {
      e.preventDefault()
      setIsSubmenuOpen(!isSubmenuOpen)
    }
  }

  const isSubmenuItemActive = (subItem) => {
    if (subItem.href === pathname) return true
    
    if (subItem.href.includes('?')) {
      const [basePath, queryString] = subItem.href.split('?')
      if (basePath === pathname) {
        const params = new URLSearchParams(queryString)
        for (const [key, value] of params.entries()) {
          if (searchParams.get(key) === value) return true
        }
      }
    }
    return false
  }

  return (
    <div className="w-full">
      <Link
        href={hasSubmenu ? '#' : item.href}
        onClick={toggleSubmenu}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-foreground",
          shouldHighlight 
            ? 'bg-primary text-white' 
            : 'text-muted-foreground hover:bg-muted',
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
              <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {submenuGroup.title}
              </div>
              {submenuGroup.items.map((subItem, index) => {
                const isSubItemActive = isSubmenuItemActive(subItem)
                return (
                  <Link
                    key={index}
                    href={subItem.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-foreground",
                      isSubItemActive 
                        ? 'bg-primary/20 text-primary font-medium border-l-2 border-primary' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {subItem.icon && <subItem.icon className="h-4 w-4" />}
                    <span>{subItem.title}</span>
                    {isSubItemActive && (
                      <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SidebarLink
