import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/token";

const PROTECTED_PAGES = ["/", "/dashboard", "/settings"];

async function isSignedIn(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return (await verifySessionToken(token)) !== null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never let the browser cache API responses: the HTTP cache could serve a
  // previous user's JSON (cross-user data leak). Every /api/* response is
  // no-store.
  const response = NextResponse.next();
  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
  }

  const signedIn = await isSignedIn(request);

  if (PROTECTED_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!signedIn) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  if (pathname === "/login" && signedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/settings/:path*", "/login", "/api/:path*"],
};
