import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'

export function createClient() {
  let supabaseHeaders
  let authToken = null

  try {
    const headersList = headers()
    supabaseHeaders = new Headers(headersList)
    
    // Extract Authorization header (set by middleware with Clerk Supabase token)
    const authHeader = headersList.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.replace('Bearer ', '')
    }
    // Silently handle missing auth header - expected for unauthenticated requests
  } catch (error) {
    // Headers not available 
    // This is expected in certain contexts, so we silently fall back
    supabaseHeaders = new Headers()
  }

  let cookieStore

  try {
    cookieStore = cookies()
  } catch (error) {
    // Cookies not available
    cookieStore = {
      getAll: () => [],
      get: () => undefined,
      set: () => {},
    }
  }

  const supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      headers: supabaseHeaders,
      cookies: {
        get(name) {
          try {
            return cookieStore.get(name)?.value
          } catch (error) {
            // Silently fail if cookie access is not available
            return undefined
          }
        },
        set(name, value, options) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Silently fail if cookie access is not available
          }
        },
        remove(name, options) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            // Silently fail if cookie access is not available
          }
        },
      },
    }
  )

  // For external auth providers like Clerk, set the Authorization header on all requests
  if (authToken) {
    // Override the default headers to include the Authorization token
    const originalFetch = supabaseClient.rest.fetch
    supabaseClient.rest.fetch = async (url, options = {}) => {
      const headers = new Headers(options.headers || {})
      // Ensure Authorization header is set for all Supabase requests
      headers.set('Authorization', `Bearer ${authToken}`)
      return originalFetch(url, { ...options, headers })
    }
  }
  // Silently handle missing auth token - expected for unauthenticated requests or redirects

  return supabaseClient
}