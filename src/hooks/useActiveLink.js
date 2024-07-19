// src/hooks/useActiveLink.ts
import { usePathname } from 'next/navigation'

export const useActiveLink = (href) => {
  const pathname = usePathname();
  return pathname === href;
}