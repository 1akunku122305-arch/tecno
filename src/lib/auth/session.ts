import { cache } from "react";
import { headers } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export interface AuthContext {
  supabase: SupabaseClient;
  user: User | null;
  profile: Profile | null;
}

/**
 * Cached per-request auth context. Layout and page render in the same request,
 * so calling this from both performs the `getUser` + profile lookup exactly
 * once thanks to React's `cache()`.
 */
export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = (data as Profile | null) ?? null;
  }

  return { supabase, user: user ?? null, profile };
});

/**
 * Read the authenticated user id forwarded by middleware via the
 * `x-user-id` request header. Zero network cost — lets pages run their data
 * queries without re-verifying the session on every navigation.
 */
export async function getRequestUserId(): Promise<string | null> {
  const h = await headers();
  return h.get("x-user-id");
}
