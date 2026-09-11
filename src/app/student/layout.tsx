import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth/guards";
import { getUnreadCount } from "@/services/notification.service";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { STUDENT_NAV } from "@/components/dashboard/nav";

export const metadata: Metadata = { title: "Student Dashboard" };

/**
 * Authentication gate + dashboard shell for all /student pages. The shell lives
 * in the layout so it persists across client navigations: navigating between
 * menu items no longer re-fetches the profile and unread count every click.
 */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireStudent();
  const unread = user ? await getUnreadCount(supabase, user.id) : 0;

  return (
    <DashboardShell
      items={STUDENT_NAV}
      role="student"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      unreadNotifications={unread}
    >
      {children}
    </DashboardShell>
  );
}
