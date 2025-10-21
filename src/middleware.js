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
  const { userId } = await auth();  
  const pathname = req.nextUrl.pathname;

  // Allow public routes
  if (isPublicRoute(req)) return NextResponse.next();

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
  if (userId) {
    const isForwarderRoute = pathname.startsWith("/forwarders");
    const isExporterRoute = pathname.startsWith("/exporters");

    if (isForwarderRoute || isExporterRoute) {
      try {
        const membership = await getUserCompanyMembership(userId);
        const companyType = membership?.companies?.type;

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
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
