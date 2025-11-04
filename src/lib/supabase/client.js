import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in client components
 * @param {string} [token] - Optional Clerk JWT token for RLS authentication
 * @returns {ReturnType<createBrowserClient>}
 */
export function createClient(token = null) {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // If a token is provided, override the fetch to include Authorization header
  if (token) {
    const originalFetch = client.rest.fetch
    client.rest.fetch = async (url, options = {}) => {
      const headers = new Headers(options.headers || {})
      headers.set('Authorization', `Bearer ${token}`)
      return originalFetch(url, { ...options, headers })
    }
  }

  return client
}