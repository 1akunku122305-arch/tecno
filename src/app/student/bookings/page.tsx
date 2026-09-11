import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRequestUserId } from "@/lib/auth/session";
import { getBookingsForDashboard } from "@/services/booking.service";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { BookingList } from "@/components/dashboard/booking-list";

export const metadata: Metadata = { title: "Booking Saya" };
export const dynamic = "force-dynamic";

export default async function StudentBookingsPage() {
  const supabase = await createClient();
  const userId = await getRequestUserId();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let bookings: Awaited<ReturnType<typeof getBookingsForDashboard>> = [];
  if (configured && userId) {
    bookings = await getBookingsForDashboard(supabase, userId, "student");
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-950">Booking Saya</h1>
          <p className="mt-1 text-sm text-ink-500">Semua permintaan konsultasi kamu.</p>
        </div>
        <Link
          href="/find-mentor"
          className="hidden h-10 items-center rounded-none bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 sm:inline-flex"
        >
          + Booking Baru
        </Link>
      </div>
      {configured ? (
        <BookingList
          bookings={bookings}
          emptyTitle="Belum ada booking."
          emptyDescription="Cari mentor yang sesuai kebutuhanmu dan buat booking pertama."
        />
      ) : (
        <SetupPanel />
      )}

    </>
  );
}
