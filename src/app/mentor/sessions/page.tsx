import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getRequestUserId } from "@/lib/auth/session";
import { getBookingsForDashboard } from "@/services/booking.service";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { Badge, EmptyState } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { MeetingUrlForm } from "@/components/mentor/meeting-url-form";
import { SessionActions } from "@/components/dashboard/session-actions";
import { timeHM } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = { title: "Sesi" };
export const dynamic = "force-dynamic";

export default async function MentorSessionsPage() {
  const supabase = await createClient();
  const userId = await getRequestUserId();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let bookings: Awaited<ReturnType<typeof getBookingsForDashboard>> = [];
  if (configured && userId) {
    bookings = await getBookingsForDashboard(supabase, userId, "mentor", ["confirmed", "completed"]);
  }
  const sessions = bookings.filter((b) => b.session).sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-950">Sesi</h1>
        <p className="mt-1 text-sm text-ink-500">Kelola sesi konsultasi dan link meeting.</p>
      </div>

      {!configured && <SetupPanel />}
      {configured && sessions.length === 0 && (
        <EmptyState
          icon={<GraduationCap className="h-10 w-10" aria-hidden />}
          title="Belum ada sesi."
          description="Sesi dibuat otomatis saat booking dikonfirmasi."
        />
      )}
      {configured && sessions.length > 0 && (
        <ul className="space-y-4">
          {sessions.map((b) => (
            <li key={b.id} className="rounded-none border border-ink-200/80 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar src={b.student?.avatar_url} name={b.student?.full_name} size={42} />
                  <div>
                    <p className="font-bold text-ink-950">{b.student?.full_name ?? "Mahasiswa"}</p>
                    <p className="text-xs text-ink-500">
                      {b.subject?.name} · {b.topic}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink-900">
                    {b.date} · {timeHM(b.start_time)}–{timeHM(b.end_time)}
                  </p>
                  <Badge tone={b.session?.status === "completed" ? "brand" : "green"} className="mt-1">
                    {b.session?.status === "completed" ? "Selesai" : "Terjadwal"}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 border-t border-ink-100 pt-4">
                <MeetingUrlForm bookingId={b.id} initialUrl={b.session?.meeting_url} />
              </div>

              {b.session && b.session.status !== "completed" && (
                <div className="mt-3">
                  <SessionActions bookingId={b.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

    </>
  );
}
