import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserCompanyMembership } from "@/data-access/companies";

// Public routes (landing + auth pages)
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhooks/clerk",
  "/api/cron(.*)",
  "/auth(.*)",   // catch-all auth
  "/signin(.*)",
  "/signup(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  let userId = null;
  let supabaseToken = null;
  
  try {
    const authResult = await auth();
    userId = authResult?.userId || null;
    if (userId) {
      try {
        supabaseToken = await authResult.getToken({ template: "supabase"});
      } catch (tokenError) {
        // Token generation failed, but we can still proceed without it
        console.warn("Failed to generate Supabase token in middleware:", tokenError);
      }
    }
  } catch (authError) {
    // Clerk auth failed - this can happen during navigation transitions
    // Allow the request to proceed, the page will handle authentication
    console.warn("Clerk auth error in middleware (likely navigation transition):", authError);
    // For API routes, we might want to return early, but for pages, let them handle it
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.next();
    }
    // For non-API routes, redirect to sign in if not a public route
    const pathname = req.nextUrl.pathname;
    const isAuthRoute = pathname.startsWith("/auth") || pathname.startsWith("/signin") || pathname.startsWith("/signup");
    if (!isAuthRoute) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/signin";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  
  const pathname = req.nextUrl.pathname;

  // Allow public routes
  if (isPublicRoute(req)) {
    if (supabaseToken) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("Authorization", `Bearer ${supabaseToken}`);
      return NextResponse.next({
        request: { headers: requestHeaders }
      });
    }
    return NextResponse.next();
  }

  // Signed-in users on auth pages → redirect to dashboard
  const isAuthRoute =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup");

  if (userId && isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Not signed in → redirect to catch-all sign in
  if (!userId && !isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/signin";  // your catch-all SignIn route
    return NextResponse.redirect(url);
  }

  // Signed-in → enforce company-type access
  // Skip /dashboard route - it handles its own routing logic
  if (userId && pathname !== "/dashboard") {
    const isForwarderRoute = pathname.startsWith("/forwarders");
    const isExporterRoute = pathname.startsWith("/exporters");

    if (isForwarderRoute || isExporterRoute) {
      try {
        const membership = await getUserCompanyMembership(userId);
        const companyType = membership?.companies?.type;

        // If membership can't be determined, let /dashboard handle it
        if (!membership || !companyType) {
          // Don't redirect - let the page handle missing membership
          // But still add the token header before proceeding
          if (supabaseToken) {
            const requestHeaders = new Headers(req.headers);
            requestHeaders.set("Authorization", `Bearer ${supabaseToken}`);
            return NextResponse.next({
              request: { headers: requestHeaders }
            });
          }
          return NextResponse.next();
        }

        // Allow exporters to access /forwarders (for browsing freight forwarders)
        // Only block /forwarders/dashboard and other forwarder-specific routes
        const isForwarderDashboard = pathname.startsWith("/forwarders/dashboard") || 
                                   pathname.startsWith("/forwarders/orders") ||
                                   pathname.startsWith("/forwarders/exporters");
        
        if (isForwarderDashboard && companyType !== "FREIGHT_FORWARDER") {
          const url = req.nextUrl.clone();
          url.pathname = "/dashboard";
          return NextResponse.redirect(url);
        }

        if (isExporterRoute && companyType !== "EXPORTER") {
          const url = req.nextUrl.clone();
          url.pathname = "/dashboard";
          return NextResponse.redirect(url);
        }
      } catch (err) {
        console.error("Error checking membership:", err);
        // On error, allow the request to proceed to avoid redirect loops
        // The page component will handle the error state
        // But still add the token header before proceeding
        if (supabaseToken) {
          const requestHeaders = new Headers(req.headers);
          requestHeaders.set("Authorization", `Bearer ${supabaseToken}`);
          return NextResponse.next({
            request: { headers: requestHeaders }
          });
        }
        return NextResponse.next();
      }
    }
  }

  // Add token to headers for all authenticated requests
  if (supabaseToken) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("Authorization", `Bearer ${supabaseToken}`);
    return NextResponse.next({
      request: { headers: requestHeaders }
    });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
