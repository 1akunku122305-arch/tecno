import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function isProtectedPath(pathname: string): boolean {
  // Exact segment match — /mentors/[id] is PUBLIC, /mentor/* is not.
  return (
    pathname === "/student" ||
    pathname.startsWith("/student/") ||
    pathname === "/mentor" ||
    pathname.startsWith("/mentor/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public pages (landing, search, mentor profiles, auth) don't need a session
  // check — skip the Supabase round-trip entirely so they stay fast.
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Forward the authenticated user id to server components via a request
  // header, so pages can query their data without a second auth round-trip.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", user.id);

  const next = NextResponse.next({ request: { headers: requestHeaders } });

  // Preserve any session-refresh cookies set by updateSession.
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      next.headers.append("set-cookie", value);
    }
  });

  return next;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
