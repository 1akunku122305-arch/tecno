import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getBookingsForDashboard } from "@/services/booking.service";
import { getUnreadCount } from "@/services/notification.service";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { STUDENT_NAV as NAV } from "@/components/dashboard/nav";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { EmptyState } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { ReviewForm } from "@/components/review/review-form";
import { formatPrice, timeHM, BOOKING_STATUS_LABEL } from "@/lib/utils";
import { History } from "lucide-react";

export const metadata: Metadata = { title: "Riwayat" };
export const dynamic = "force-dynamic";

export default async function StudentHistoryPage() {
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

  let bookings: Awaited<ReturnType<typeof getBookingsForDashboard>> = [];
  if (configured && user) {
    bookings = await getBookingsForDashboard(supabase, user.id, "student", ["completed", "rejected", "cancelled"]);
  }
  const completed = bookings.filter((b) => b.status === "completed");
  const others = bookings.filter((b) => b.status !== "completed");

  return (
    <DashboardShell
      items={NAV}
      current="history"
      role="student"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      unreadNotifications={configured ? await getUnreadCount(supabase, user?.id ?? "") : 0}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-950">Riwayat</h1>
        <p className="mt-1 text-sm text-ink-500">Sesi yang selesai, ditolak, atau dibatalkan.</p>
      </div>

      {!configured && <SetupPanel />}
      {configured && bookings.length === 0 && (
        <EmptyState
          icon={<History className="h-10 w-10" aria-hidden />}
          title="Belum ada riwayat."
          description="Riwayat booking akan muncul di sini."
        />
      )}

      {configured && bookings.length > 0 && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-bold text-ink-950">Sesi Selesai</h2>
            {completed.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-500">
                Belum ada sesi yang selesai.
              </p>
            ) : (
              <ul className="space-y-4">
                {completed.map((b) => (
                  <li key={b.id} className="rounded-2xl border border-ink-200/80 bg-white p-5">
                    <div className="flex items-center gap-3">
                      <Avatar src={b.mentor?.avatar_url} name={b.mentor?.full_name} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink-950">{b.mentor?.full_name ?? "Mentor"}</p>
                        <p className="truncate text-xs text-ink-500">
                          {b.subject?.name} · {b.topic} · {b.date} {timeHM(b.start_time)} · {formatPrice(b.price)}
                        </p>
                      </div>
                      {b.review && <span className="text-sm font-semibold text-emerald-600">✓ {b.review.rating}/5</span>}
                    </div>
                    {!b.review && (
                      <div className="mt-4 border-t border-ink-100 pt-4">
                        <ReviewForm bookingId={b.id} mentorId={b.mentor_id} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {others.length > 0 && (
            <section>
              <h2 className="mb-3 font-bold text-ink-950">Lainnya</h2>
              <ul className="space-y-2">
                {others.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-xl border border-ink-200/80 bg-white p-4 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900">{b.subject?.name} · {b.topic}</p>
                      <p className="text-xs text-ink-500">{b.date} · {BOOKING_STATUS_LABEL[b.status]}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
