// Import NextResponse from next/server
const { NextResponse } = require("next/server");

/**
 * Middleware function for Next.js routes
 * @param {import("next/server").NextRequest} request - The incoming request
 * @returns {import("next/server").NextResponse} - The response
 */
export function middleware(request) {
  // Check if the user is authenticated by looking for the session cookie
  const sessionCookie = request.cookies.get("sessionId");
  
  // Define protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/admin/dashboard"];
  const adminRoutes = ["/admin"];
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + "/"),
  );
  
  // Check if the current path is an admin route
  const isAdminRoute = adminRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + "/"),
  );
  
  // If it's a protected route and there's no session cookie, redirect to sign-in
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  
  // For admin routes, we'll let the component handle the role check
  // This is because we need to fetch the user data to check the role
  
  // Continue with the request
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};