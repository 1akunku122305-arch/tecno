import { redirect } from "next/navigation";
import type { UserRole } from "@/types";
import { getAuthContext, type AuthContext } from "./session";

export { getAuthContext } from "./session";

/**
 * Require a signed-in user with the given role. Uses the cached auth context
 * so the layout guard and page share a single getUser + profile lookup per
 * request. Returns the context so callers can reuse supabase/user/profile.
 */
async function requireRole(role: UserRole): Promise<AuthContext> {
  const ctx = await getAuthContext();

  if (!ctx.user) redirect("/login");

  if (!ctx.profile || ctx.profile.role !== role) {
    // If a signed-in user has NO profile row (trigger edge case) send them to
    // the landing page instead of /login — redirecting back to /login would
    // create an infinite redirect loop for a logged-in user.
    const fallback = ctx.profile ? `/${ctx.profile.role}/dashboard` : "/";
    redirect(fallback);
  }

  return ctx;
}

export function requireStudent() {
  return requireRole("student");
}

export function requireMentor() {
  return requireRole("mentor");
}

export function requireAdmin() {
  return requireRole("admin");
}
