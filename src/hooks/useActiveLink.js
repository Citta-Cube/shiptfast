"use client";

import { usePathname } from 'next/navigation';

export const useActiveLink = (href) => {
  const pathname = usePathname();

  // Handle root path exactly
  if (href === '/dashboard' || href === '/forwarders/dashboard') {
    return pathname === href || pathname.startsWith(href + '?');
  }

  // Handle exact matches for other paths
  if (pathname === href) {
    return true;
  }

  // Handle paths with query parameters
  if (href.includes('?')) {
    const [basePath, queryString] = href.split('?');
    if (pathname === basePath) {
      if (typeof window !== 'undefined') {
        const currentUrl = new URL(window.location.href);
        const hrefUrl = new URL(href, window.location.origin);

        for (const [key, value] of hrefUrl.searchParams.entries()) {
          if (currentUrl.searchParams.get(key) !== value) {
            return false;
          }
        }
        return true;
      }
    }
  }

  // Handle nested paths (for submenu items)
  return pathname.startsWith(href) && href !== '/';
};
