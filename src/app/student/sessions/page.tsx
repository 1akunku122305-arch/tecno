import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRequestUserId } from "@/lib/auth/session";
import { getBookingsForDashboard } from "@/services/booking.service";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { Badge, EmptyState } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { timeHM } from "@/lib/utils";
import { CalendarClock, Video } from "lucide-react";

export const metadata: Metadata = { title: "Sesi Saya" };
export const dynamic = "force-dynamic";

const statusTone = (s?: string) =>
  s === "completed" ? "brand" : s === "in_progress" ? "green" : "amber";

export default async function StudentSessionsPage() {
  const supabase = await createClient();
  const userId = await getRequestUserId();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let bookings: Awaited<ReturnType<typeof getBookingsForDashboard>> = [];
  if (configured && userId) {
    bookings = await getBookingsForDashboard(supabase, userId, "student", [
      "confirmed",
      "completed",
    ]);
  }

  const ordered = bookings
    .filter((b) => b.session)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-950">Sesi Saya</h1>
        <p className="mt-1 text-sm text-ink-500">
          Lihat jadwal dan link meeting sesi konsultasimu.
        </p>
      </div>

      {!configured && <SetupPanel />}
      {configured && ordered.length === 0 && (
        <EmptyState
          icon={<CalendarClock className="h-10 w-10" aria-hidden />}
          title="Belum ada sesi."
          description="Sesi akan muncul setelah mentor mengonfirmasi booking kamu."
          action={
            <Link href="/find-mentor" className="text-sm font-semibold text-brand-600 hover:underline">
              Cari mentor
            </Link>
          }
        />
      )}
      {configured && ordered.length > 0 && (
        <ul className="space-y-4">
          {ordered.map((b) => (
            <li key={b.id} className="rounded-none border border-ink-200/80 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar src={b.mentor?.avatar_url} name={b.mentor?.full_name} size={42} />
                  <div>
                    <p className="font-bold text-ink-950">{b.mentor?.full_name ?? "Mentor"}</p>
                    <p className="text-xs text-ink-500">
                      {b.subject?.name} · {b.topic}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-ink-900">
                    {b.date} · {timeHM(b.start_time)}–{timeHM(b.end_time)}
                  </p>
                  <Badge tone={statusTone(b.session?.status) as "green"} className="mt-1">
                    {b.session?.status === "completed"
                      ? "Selesai"
                      : b.session?.status === "in_progress"
                        ? "Berlangsung"
                        : "Terjadwal"}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 border-t border-ink-100 pt-4">
                {b.session?.meeting_url ? (
                  <a
                    href={b.session.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-none bg-brand-50 px-3 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                  >
                    <Video className="h-4 w-4" aria-hidden /> Buka Link Meeting
                  </a>
                ) : (
                  <p className="text-xs text-ink-400">
                    Link meeting belum tersedia. Mentor dapat mengisinya dari profil.
                  </p>
                )}
              </div>

              {b.session && b.session.status !== "completed" && (
                <p className="mt-3 text-xs text-ink-400">
                  Sesi dikelola oleh mentor — setelah dimulai, kamu bisa mengakses link meeting di atas.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

    </>
  );
}
