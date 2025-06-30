import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/create-tournament", "/dashboard", "/api"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    const privyToken = request.cookies.get("privy-token");

    if (!privyToken) {
      return NextResponse.redirect(new URL("/?login=required", request.url));
    }

    // Just check if token exists - actual verification happens in API routes
    // Forward the token to downstream handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-privy-token", privyToken.value);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/create-tournament/:path*", "/dashboard/:path*", "/api/:path*"],
};
