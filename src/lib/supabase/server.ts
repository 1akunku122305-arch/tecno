// ---------------------------------------------------------------------------
// Server-side Supabase client (Next.js App Router, cookie-based SSR sessions)
// ---------------------------------------------------------------------------
import { createServerClient } from "@supabase/ssr";
import { cache } from "react";
import { cookies } from "next/headers";

type CookieToSet = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

/**
 * Cached per-request client — see the Supabase SSR docs. Wrapping in React
 * `cache()` means a single request (layout + page + actions) shares one client
 * and only reads cookies once, avoiding duplicate client construction.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore when middleware
            // is refreshing sessions.
          }
        },
      },
    }
  );
});

