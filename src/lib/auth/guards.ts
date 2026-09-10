import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types";

/**
 * Server helper: get the signed-in user + their profile role.
 * Returns { user: null, profile: null } when signed out (callers decide).
 */
export async function getSessionUser(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null as null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, university, major, semester, bio")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

export async function requireUser(supabase: SupabaseClient) {
  const ctx = await getSessionUser(supabase);
  if (!ctx.user) redirect("/login");
  return ctx;
}

export async function requireRole(
  supabase: SupabaseClient,
  role: UserRole
) {
  const ctx = await requireUser(supabase);
  if (!ctx.profile || ctx.profile.role !== role) {
    // If a signed-in user has NO profile row (trigger edge case) send them to
    // the landing page instead of /login — redirecting back to /login would
    // create an infinite redirect loop for a logged-in user.
    const fallback = ctx.profile ? `/${ctx.profile.role}/dashboard` : "/";
    redirect(fallback);
  }
  return ctx;
}

export async function requireStudent(supabase: SupabaseClient) {
  return requireRole(supabase, "student");
}

export async function requireMentor(supabase: SupabaseClient) {
  return requireRole(supabase, "mentor");
}

export async function requireAdmin(supabase: SupabaseClient) {
  return requireRole(supabase, "admin");
}
