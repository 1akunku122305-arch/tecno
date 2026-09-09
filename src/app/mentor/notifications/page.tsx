import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getNotifications, getUnreadCount } from "@/services/notification.service";
import { markNotificationsReadAction } from "@/services/review-actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MENTOR_NAV as NAV } from "@/components/dashboard/nav";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { EmptyState } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Bell } from "lucide-react";

export const metadata: Metadata = { title: "Notifikasi" };
export const dynamic = "force-dynamic";

export default async function MentorNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const notifications = configured && user ? await getNotifications(supabase, user.id) : [];
  const unread = configured ? await getUnreadCount(supabase, user?.id ?? "") : 0;

  return (
    <DashboardShell
      items={NAV}
      current="notifications"
      role="mentor"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      unreadNotifications={unread}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-950">Notifikasi</h1>
          <p className="mt-1 text-sm text-ink-500">Notifikasi dibuat otomatis dari event aplikasi.</p>
        </div>
        {notifications.length > 0 && (
          <form action={markNotificationsReadAction}>
            <button className="rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-600 hover:bg-ink-50">
              Tandai semua dibaca
            </button>
          </form>
        )}
      </div>
      {!configured && <SetupPanel />}
      {configured && notifications.length === 0 && (
        <EmptyState
          icon={<Bell className="h-10 w-10" aria-hidden />}
          title="Belum ada notifikasi."
          description="Kamu akan menerima notifikasi saat ada permintaan booking baru atau update sesi."
        />
      )}
      {configured && notifications.length > 0 && (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={
                "rounded-xl border bg-white p-4 " +
                (n.is_read ? "border-ink-200/60" : "border-brand-200 bg-brand-50/50")
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink-950">{n.title}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{n.message}</p>
                </div>
                <span className="shrink-0 text-[11px] text-ink-400">{formatDateTime(n.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
