import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const currentUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  requestHeaders.set("x-auth-callback-url", currentUrl);
  requestHeaders.set("x-auth-current-path", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
