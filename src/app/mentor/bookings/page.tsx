import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getRequestUserId } from "@/lib/auth/session";
import { getBookingsForDashboard } from "@/services/booking.service";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { EmptyState } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { AcceptRejectButtons } from "@/components/dashboard/booking-actions";
import { BOOKING_STATUS_LABEL, formatPrice, timeHM } from "@/lib/utils";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Booking Mentor" };
export const dynamic = "force-dynamic";

export default async function MentorBookingsPage() {
  const supabase = await createClient();
  const userId = await getRequestUserId();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let bookings: Awaited<ReturnType<typeof getBookingsForDashboard>> = [];
  if (configured && userId) {
    bookings = await getBookingsForDashboard(supabase, userId, "mentor");
  }
  const order = { pending: 0, confirmed: 1, completed: 2, rejected: 3, cancelled: 4 } as const;
  bookings.sort((a, b) => (order[a.status] ?? 5) - (order[b.status] ?? 5) || (a.date < b.date ? 1 : -1));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-950">Booking</h1>
        <p className="mt-1 text-sm text-ink-500">Terima atau tolak permintaan booking dari mahasiswa.</p>
      </div>

      {!configured && <SetupPanel />}
      {configured && bookings.length === 0 && (
        <EmptyState
          icon={<BookOpen className="h-10 w-10" aria-hidden />}
          title="Belum ada booking."
          description="Permintaan booking dari mahasiswa akan muncul di sini."
        />
      )}
      {configured && bookings.length > 0 && (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id} className="flex flex-col gap-3 rounded-none border border-ink-200/80 bg-white p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar src={b.student?.avatar_url} name={b.student?.full_name} size={42} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink-950">{b.student?.full_name ?? "Mahasiswa"}</p>
                  <p className="truncate text-xs text-ink-500">
                    {b.subject?.name} · {b.topic}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-600">
                <span className="font-semibold text-ink-900">{b.date} {timeHM(b.start_time)}–{timeHM(b.end_time)}</span>
                <span>· {b.duration_minutes} mnt</span>
                <span>· {formatPrice(b.price)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-none bg-ink-100 px-2.5 py-0.5 text-xs font-semibold text-ink-700">
                  {BOOKING_STATUS_LABEL[b.status]}
                </span>
                {b.status === "pending" && <AcceptRejectButtons bookingId={b.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}

    </>
  );
}
