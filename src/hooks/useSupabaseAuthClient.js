// src/utils/useSupabaseAuthClient.js
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'

export default function useSupabaseAuthClient() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [supabase, setSupabase] = useState(null)

  useEffect(() => {
    let active = true

    const initSupabase = async () => {
      if (!isLoaded || !isSignedIn) return

      // Always get a fresh Clerk JWT (this auto-refreshes under the hood)
      const token = await getToken({ template: 'supabase' })

      if (!token) {
        console.warn('No Clerk token found')
        return
      }

      if (supabase && typeof supabase.setRlsToken === 'function') {
        supabase.setRlsToken(token)
      } else {
        // Create new Supabase client with the latest token
        const client = createClient(token)
        if (active) {
          setSupabase(client)
        }
      }
    }

    initSupabase()

    // 🔁 Refresh token every 50 seconds (just before Clerk's expires)
    const interval = setInterval(initSupabase, 50 * 1000)

    // 🔁 Also refresh on tab focus/visibility to handle throttled timers
    const onFocus = () => initSupabase()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') initSupabase()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      active = false
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [getToken, isLoaded, isSignedIn, supabase])

  return supabase
}
