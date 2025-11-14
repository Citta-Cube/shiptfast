import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in client components
 * @param {string} [token] - Optional Clerk JWT token for RLS authentication
 * @returns {ReturnType<createBrowserClient>}
 */
export function createClient(token = null) {
  let currentToken = token || null
  const hasToken = Boolean(currentToken)
  let hasScheduledReload = false
  const scheduleReload = () => {
    if (typeof window === 'undefined') return
    if (hasScheduledReload) return
    hasScheduledReload = true
    const doReload = () => {
      try {
        window.location.reload()
      } catch {}
    }
    if (document.visibilityState === 'visible') {
      setTimeout(doReload, 50)
    } else {
      const onVisible = () => {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', onVisible)
          setTimeout(doReload, 50)
        }
      }
      document.addEventListener('visibilitychange', onVisible)
    }
  }
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${currentToken}`,
            },
          },
          // Ensure realtime connections include the JWT too
          realtime: {
            params: {
              // apikey is still required by the server
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${currentToken}`,
            },
          },
        }
      : undefined
  )

  // Always inject Authorization on REST calls from the latest token
  const originalFetch = client.rest.fetch
  client.rest.fetch = async (url, options = {}) => {
    const headers = new Headers(options.headers || {})
    if (currentToken) headers.set('Authorization', `Bearer ${currentToken}`)
    const response = await originalFetch(url, { ...options, headers })
    // Auto-reload on auth failures to recover from a bad/expired JWT edge-case
    if (response && (response.status === 401 || response.status === 403)) {
      try {
        const cloned = response.clone()
        let body
        try {
          body = await cloned.json()
        } catch {
          body = null
        }
        const msg = (body?.message || '').toString().toLowerCase()
        const code = (body?.code || '').toString().toUpperCase()
        if (
          msg.includes('jwt') ||
          msg.includes('token') ||
          code === 'PGRST301'
        ) {
          scheduleReload()
        }
      } catch {}
    }
    return response
  }

  // Provide a way to update the token without recreating the client
  client.setRlsToken = (nextToken) => {
    currentToken = nextToken || null
    // Update global headers for future requests
    if (client.storage) {
      // storage uses the same rest client headers
    }
    // Update realtime params if available
    if (client?.realtime?.setAuth) {
      client.realtime.setAuth(currentToken)
    } else if (client?.realtime) {
      // best-effort: update params for next connection
      try {
        client.realtime._headers = {
          ...(client.realtime._headers || {}),
          Authorization: currentToken ? `Bearer ${currentToken}` : undefined,
        }
      } catch {}
    }
  }

  return client
}