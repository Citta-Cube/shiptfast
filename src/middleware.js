import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { getUserCompanyMembership } from '@/data-access/companies'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: auth.getUser() must be called FIRST
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Handle authentication-related redirects
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth') || 
                      request.nextUrl.pathname.startsWith('/signin') || 
                      request.nextUrl.pathname.startsWith('/signup') ||
                      request.nextUrl.pathname === '/';
  
  // If user is signed in and trying to access auth pages, redirect to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  
  // If user is not signed in and trying to access protected pages, redirect to signin
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/signin') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  // If user is authenticated, enforce role-based access control
  if (user) {
    // Check if user is attempting to access role-specific pages
    const isForwarderRoute = request.nextUrl.pathname.startsWith('/forwarders');
    const isExporterRoute = request.nextUrl.pathname.startsWith('/exporters');
    
    if (isForwarderRoute || isExporterRoute) {
      // Get user's company type
      const companyMembership = await getUserCompanyMembership(user.id)   

      if (companyMembership?.companies?.type) {
        const companyType = companyMembership.companies.type;
        
        // Redirect if user is accessing the wrong role's routes
        if (isForwarderRoute && companyType !== 'FREIGHT_FORWARDER') {
          const url = request.nextUrl.clone();
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        }
        
        if (isExporterRoute && companyType !== 'EXPORTER') {
          const url = request.nextUrl.clone();
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        }
      }
    }
  }
  
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}