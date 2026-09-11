import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRequestUserId } from "@/lib/auth/session";
import { getBooking } from "@/services/booking.service";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { Avatar } from "@/components/avatar";
import { Badge, EmptyState } from "@/components/ui/badge";
import { CancelBookingButton } from "@/components/dashboard/booking-actions";
import { ReviewForm } from "@/components/review/review-form";
import { BOOKING_STATUS_LABEL, formatPrice, timeHM } from "@/lib/utils";
import { CalendarX2 } from "lucide-react";

export const metadata: Metadata = { title: "Detail Booking" };
export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const userId = await getRequestUserId();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let booking = null;
  if (configured && userId) {
    const b = await getBooking(supabase, id);
    // security: only owner (RLS also enforces)
    if (b && b.student_id === userId) booking = b;
  }

  return (
    <>
      <div className="mx-auto max-w-3xl">
        <nav className="mb-4 text-sm text-ink-500" aria-label="Breadcrumb">
          <Link href="/student/bookings" className="hover:text-brand-600">Booking Saya</Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-ink-800">Detail</span>
        </nav>

        {!configured && <SetupPanel />}
        {configured && !booking && (
          <EmptyState icon={<CalendarX2 className="h-10 w-10" aria-hidden />} title="Booking tidak ditemukan." />
        )}
        {configured && booking && (
          <div className="space-y-6">
            <div className="rounded-none border border-ink-200/80 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-extrabold text-ink-950">Detail Booking</h1>
                  <p className="mt-0.5 text-xs text-ink-400">ID: {booking.id.slice(0, 8)}</p>
                </div>
                <Badge tone={booking.status === "confirmed" ? "green" : booking.status === "completed" ? "brand" : booking.status === "pending" ? "amber" : "red"}>
                  {BOOKING_STATUS_LABEL[booking.status]}
                </Badge>
              </div>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div className="rounded-none bg-ink-50 p-3">
                  <dt className="text-xs text-ink-500">Mentor</dt>
                  <dd className="mt-1 flex items-center gap-2 font-semibold text-ink-900">
                    <Avatar src={booking.mentor?.avatar_url} name={booking.mentor?.full_name} size={28} />
                    {booking.mentor?.full_name ?? "-"}
                  </dd>
                </div>
                <div className="rounded-none bg-ink-50 p-3">
                  <dt className="text-xs text-ink-500">Mata Kuliah</dt>
                  <dd className="mt-1 font-semibold text-ink-900">{booking.subject?.name ?? "-"}</dd>
                </div>
                <div className="rounded-none bg-ink-50 p-3">
                  <dt className="text-xs text-ink-500">Topik</dt>
                  <dd className="mt-1 font-semibold text-ink-900">{booking.topic}</dd>
                </div>
                <div className="rounded-none bg-ink-50 p-3">
                  <dt className="text-xs text-ink-500">Jadwal</dt>
                  <dd className="mt-1 font-semibold text-ink-900">
                    {booking.date} · {timeHM(booking.start_time)}–{timeHM(booking.end_time)} ({booking.duration_minutes} mnt)
                  </dd>
                </div>
                <div className="rounded-none bg-ink-50 p-3">
                  <dt className="text-xs text-ink-500">Biaya</dt>
                  <dd className="mt-1 font-semibold text-ink-900">{formatPrice(booking.price)}</dd>
                </div>
                <div className="rounded-none bg-ink-50 p-3">
                  <dt className="text-xs text-ink-500">Catatan</dt>
                  <dd className="mt-1 text-ink-700">{booking.notes || "-"}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                {booking.status === "pending" && <CancelBookingButton bookingId={booking.id} />}
                {booking.status === "confirmed" && (
                  <Link href="/student/sessions" className="text-sm font-semibold text-brand-600 hover:underline">
                    Lihat sesi →
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-none border border-ink-200/80 bg-white p-6">
              <h2 className="font-bold text-ink-950">Pembayaran</h2>
              {booking.payment ? (
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-ink-500">Status</p>
                    <p className="font-semibold capitalize text-ink-900">{booking.payment.payment_status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-500">Metode</p>
                    <p className="font-semibold text-ink-900">{booking.payment.payment_method ?? "Belum dipilih"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-500">Referensi</p>
                    <p className="font-semibold text-ink-900">{booking.payment.transaction_reference ?? "-"}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-none border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-800">
                  Payment integration coming soon — pembayaran belum diproses pada MVP.
                </div>
              )}
            </div>

            {booking.status === "completed" && !booking.review && (
              <section>
                <h2 className="mb-3 font-bold text-ink-950">Evaluasi Mentor</h2>
                <ReviewForm bookingId={booking.id} mentorId={booking.mentor_id} />
              </section>
            )}
          </div>
        )}
      </div>

    </>
  );
}
