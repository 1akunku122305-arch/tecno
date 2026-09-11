import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getRequestUserId } from "@/lib/auth/session";
import { getNotifications } from "@/services/notification.service";
import { markNotificationsReadAction } from "@/services/review-actions";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { EmptyState } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Bell } from "lucide-react";

export const metadata: Metadata = { title: "Notifikasi" };
export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const userId = await getRequestUserId();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const notifications = configured && userId ? await getNotifications(supabase, userId) : [];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-950">Notifikasi</h1>
          <p className="mt-1 text-sm text-ink-500">Notifikasi untuk admin.</p>
        </div>
        {notifications.length > 0 && (
          <form action={markNotificationsReadAction}>
            <button className="rounded-none border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-600 hover:bg-ink-50">
              Tandai semua dibaca
            </button>
          </form>
        )}
      </div>
      {!configured && <SetupPanel />}
      {configured && notifications.length === 0 && (
        <EmptyState
          icon={<Bell className="h-10 w-10" aria-hidden />}
          title="Belum ada notifikasi admin."
          description="Notifikasi event akan tampil di sini."
        />
      )}
      {configured && notifications.length > 0 && (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id} className={"rounded-none border bg-white p-4 " + (n.is_read ? "border-ink-200/60" : "border-brand-200 bg-brand-50/50")}>
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

    </>
  );
}
