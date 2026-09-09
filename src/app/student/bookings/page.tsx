import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBookingsForDashboard } from "@/services/booking.service";
import { getUnreadCount } from "@/services/notification.service";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { STUDENT_NAV as NAV } from "@/components/dashboard/nav";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { BookingList } from "@/components/dashboard/booking-list";

export const metadata: Metadata = { title: "Booking Saya" };
export const dynamic = "force-dynamic";

export default async function StudentBookingsPage() {
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
    bookings = await getBookingsForDashboard(supabase, user.id, "student");
  }

  return (
    <DashboardShell
      items={NAV}
      current="bookings"
      role="student"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      unreadNotifications={configured ? await getUnreadCount(supabase, user?.id ?? "") : 0}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-950">Booking Saya</h1>
          <p className="mt-1 text-sm text-ink-500">Semua permintaan konsultasi kamu.</p>
        </div>
        <Link
          href="/find-mentor"
          className="hidden h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 sm:inline-flex"
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
    </DashboardShell>
  );
}
