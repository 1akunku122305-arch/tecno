import type { Metadata } from "next";
import { requireMentor } from "@/lib/auth/guards";
import { getUnreadCount } from "@/services/notification.service";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MENTOR_NAV } from "@/components/dashboard/nav";

export const metadata: Metadata = { title: "Mentor Dashboard" };

/**
 * Authentication gate + dashboard shell for all /mentor pages. The shell lives
 * in the layout so it persists across client navigations.
 */
export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireMentor();
  const unread = user ? await getUnreadCount(supabase, user.id) : 0;

  return (
    <DashboardShell
      items={MENTOR_NAV}
      role="mentor"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      unreadNotifications={unread}
    >
      {children}
    </DashboardShell>
  );
}
