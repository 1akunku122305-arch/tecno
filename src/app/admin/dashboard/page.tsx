import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminStats, listBookingsAdmin } from "@/services/admin.service";
import { getUnreadCount } from "@/services/notification.service";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ADMIN_NAV as NAV } from "@/components/dashboard/nav";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { Card } from "@/components/ui/card";
import { BOOKING_STATUS_LABEL, timeHM } from "@/lib/utils";
import {
  BookOpen,
  CheckCircle2,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Tags,
  Users,
} from "lucide-react";

export const metadata: Metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
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

  let stats: Awaited<ReturnType<typeof getAdminStats>> | null = null;
  let bookings: Awaited<ReturnType<typeof listBookingsAdmin>> = [];
  if (configured) {
    const [s, b] = await Promise.all([getAdminStats(supabase), listBookingsAdmin(supabase, 10)]);
    stats = s;
    bookings = b;
  }

  const cards = [
    { label: "Total Mahasiswa", value: stats?.totalStudents ?? 0, icon: Users },
    { label: "Total Mentor", value: stats?.totalMentors ?? 0, icon: GraduationCap },
    { label: "Mentor Pending", value: stats?.pendingMentors ?? 0, icon: CheckCircle2 },
    { label: "Mentor Terverifikasi", value: stats?.verifiedMentors ?? 0, icon: GraduationCap },
    { label: "Total Booking", value: stats?.totalBookings ?? 0, icon: BookOpen },
    { label: "Booking Aktif", value: stats?.activeBookings ?? 0, icon: BookOpen },
    { label: "Booking Selesai", value: stats?.completedBookings ?? 0, icon: CheckCircle2 },
    { label: "Kategori / Mata Kuliah", value: `${stats?.categories ?? 0} / ${stats?.subjects ?? 0}`, icon: Tags },
  ];

  return (
    <DashboardShell
      items={NAV}
      current="dashboard"
      role="admin"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      unreadNotifications={configured ? await getUnreadCount(supabase, user?.id ?? "") : 0}
    >
      {!configured && <SetupPanel />}
      {configured && stats && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-ink-950">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-ink-500">Statistik dihitung langsung dari database.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {cards.map((c) => (
              <Card key={c.label} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <c.icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold text-ink-950">{c.value}</p>
                  <p className="truncate text-[11px] font-medium text-ink-500">{c.label}</p>
                </div>
              </Card>
            ))}
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-ink-950">Booking Terbaru</h2>
              <Link href="/admin/bookings" className="text-sm font-semibold text-brand-600 hover:underline">
                Lihat semua
              </Link>
            </div>
            <Card className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-ink-100 text-xs uppercase text-ink-400">
                    <tr>
                      <th className="px-4 py-3">Mentor</th>
                      <th className="px-4 py-3">Mahasiswa</th>
                      <th className="px-4 py-3">Topik</th>
                      <th className="px-4 py-3">Jadwal</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-ink-400">
                          Belum ada booking.
                        </td>
                      </tr>
                    )}
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b border-ink-50 last:border-0">
                        <td className="px-4 py-3 font-semibold text-ink-900">
                          {(b as any).mentor?.profile?.full_name ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-ink-600">{(b as any).student?.full_name ?? "-"}</td>
                        <td className="max-w-[180px] truncate px-4 py-3 text-ink-600">{b.topic}</td>
                        <td className="px-4 py-3 text-ink-600">
                          {b.date} {timeHM(b.start_time)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-700">
                            {BOOKING_STATUS_LABEL[b.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/admin/mentors" className="rounded-2xl border border-ink-200 bg-white p-5 hover:border-brand-300">
              <p className="flex items-center gap-2 font-bold text-ink-950">
                <CheckCircle2 className="h-4 w-4 text-brand-600" aria-hidden /> Verifikasi Mentor
              </p>
              <p className="mt-1 text-sm text-ink-500">{stats.pendingMentors} pengajuan menunggu.</p>
            </Link>
            <Link href="/admin/categories" className="rounded-2xl border border-ink-200 bg-white p-5 hover:border-brand-300">
              <p className="flex items-center gap-2 font-bold text-ink-950">
                <FolderKanban className="h-4 w-4 text-brand-600" aria-hidden /> Kelola Katalog
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {stats.categories} kategori, {stats.subjects} mata kuliah.
              </p>
            </Link>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-ink-400">
            <LayoutDashboard className="h-3.5 w-3.5" aria-hidden /> Tidak ada statistik palsu — semua angka di atas berasal dari query database.
          </p>
        </div>
      )}
    </DashboardShell>
  );
}
