import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// Helper function to get the app URL from environment
function getAppUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'http://localhost:3000'
  return url.replace(/\/$/, '')
}

// Creating a handler to a GET request to route /auth/confirm
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = '/account'

  // Use NEXT_PUBLIC_APP_URL instead of request origin to prevent localhost redirects
  const appUrl = getAppUrl()
  const redirectTo = new URL(next, appUrl)
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
  }

  // return the user to an error page with some instructions
  const errorUrl = new URL('/error', appUrl)
  return NextResponse.redirect(errorUrl)
}