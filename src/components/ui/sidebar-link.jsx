// src/components/layout/SidebarLink.tsx
import React from 'react'
import Link from 'next/link'
import { useActiveLink } from '@/hooks/useActiveLink'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const SidebarLink = ({ item }) => {
  const isActive = useActiveLink(item.href)

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-foreground",
        isActive ? 'bg-primary text-white' : 'text-muted-foreground'
      )}
    >
      {item.icon && <item.icon className="h-4 w-4" />}
      {item.title}
      {item.badge && (
        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
          {item.badge}
        </Badge>
      )}
    </Link>
  )
}

export default SidebarLink