import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  let cookieStore

  try {
    cookieStore = cookies()
  } catch (error) {
    console.warn('Unable to access cookies, falling back to empty cookie store')
    cookieStore = {
      getAll: () => [],
      get: () => undefined,
      set: () => {},
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          try {
            return cookieStore.get(name)?.value
          } catch (error) {
            console.warn(`Error getting cookie ${name}:`, error)
            return undefined
          }
        },
        set(name, value, options) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            console.warn(`Error setting cookie ${name}:`, error)
          }
        },
        remove(name, options) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            console.warn(`Error removing cookie ${name}:`, error)
          }
        },
      },
    }
  )
}