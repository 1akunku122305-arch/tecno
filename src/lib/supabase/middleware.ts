import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

function isConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && /^https:\/\//.test(url));
}

/**
 * Middleware refreshes the Supabase auth session on every request.
 * When Supabase is not configured yet (local preview), it passes through so
 * the landing/auth pages still render with clear setup guidance.
 */
export async function updateSession(request: NextRequest) {
  if (!isConfigured()) {
    return { response: NextResponse.next({ request }), user: null };
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run code between createServerClient and auth.getUser().
  // Race the session lookup against a timer so a hanging Supabase project
  // degrades to "not logged in" (redirect to /login) instead of blowing past
  // Vercel's serverless execution limit with an "Application error / Digest".
  const getUser = supabase.auth.getUser();
  getUser.then(
    () => {},
    () => {}
  );
  let user: Awaited<typeof getUser>["data"]["user"] = null;
  try {
    const { data } = (await Promise.race([
      getUser,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("auth-timeout")), 6000)
      ),
    ])) as Awaited<typeof getUser>;
    user = data.user;
  } catch {
    user = null;
  }

  return { response, user };
}
