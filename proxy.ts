import { NextResponse, type NextRequest } from "next/server";

const sessionCookieName = "subreel_session";

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get(sessionCookieName)?.value;
  const isAuthorized = Boolean(sessionToken);
  const { pathname } = request.nextUrl;

  if (pathname === "/account" && !isAuthorized) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname === "/login" || pathname === "/register") && isAuthorized) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account", "/login", "/register"],
};
