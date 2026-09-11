import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/guards";
import { getUnreadCount } from "@/services/notification.service";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ADMIN_NAV } from "@/components/dashboard/nav";

export const metadata: Metadata = { title: "Admin" };

/**
 * Authentication gate + dashboard shell for all /admin pages. The shell lives
 * in the layout so it persists across client navigations.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireAdmin();
  const unread = user ? await getUnreadCount(supabase, user.id) : 0;

  return (
    <DashboardShell
      items={ADMIN_NAV}
      role="admin"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      unreadNotifications={unread}
    >
      {children}
    </DashboardShell>
  );
}
