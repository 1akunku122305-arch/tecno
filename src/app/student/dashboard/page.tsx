import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBookingsForDashboard } from "@/services/booking.service";
import { getUnreadCount } from "@/services/notification.service";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { STUDENT_NAV as NAV } from "@/components/dashboard/nav";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { timeHM, todayISO } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Compass,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
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
    try {
      bookings = await getBookingsForDashboard(supabase, user.id, "student");
    } catch {
      bookings = [];
    }
  }

  const today = todayISO();
  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.date >= today);
  const active = bookings.filter((b) => b.status === "pending" || b.status === "confirmed");
  const completed = bookings.filter((b) => b.status === "completed");
  const recentMentors = completed
    .slice()
    .reverse()
    .filter((b, i, arr) => arr.findIndex((x) => x.mentor_id === b.mentor_id) === i)
    .slice(0, 4);

  return (
    <DashboardShell
      items={NAV}
      current="dashboard"
      role="student"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      unreadNotifications={configured ? await getUnreadCount(supabase, user?.id ?? "") : 0}
    >
      {!configured && <SetupPanel />}
      {configured && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 p-6 text-white sm:p-8">
            <h1 className="text-2xl font-extrabold">
              Halo, {profile?.full_name?.split(" ")[0] ?? "Mahasiswa"} 👋
            </h1>
            <p className="mt-1.5 text-sm text-brand-100">
              Punya kendala akademik? Jelaskan kebutuhanmu dan temukan mentor yang tepat.
            </p>
            <Link
              href="/find-mentor"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-brand-700 hover:bg-brand-50"
            >
              <Compass className="h-4 w-4" aria-hidden /> Cari Mentor <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={CalendarClock} label="Sesi Mendatang" value={upcoming.length} />
            <StatCard icon={BookOpen} label="Booking Aktif" value={active.length} />
            <StatCard icon={CheckCircle2} label="Sesi Selesai" value={completed.length} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-ink-950">Sesi Mendatang</h2>
                <Link href="/student/sessions" className="text-sm font-semibold text-brand-600 hover:underline">
                  Lihat semua
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<CalendarClock className="h-9 w-9" aria-hidden />}
                    title="Belum ada sesi mendatang."
                    description="Cari mentor dan booking sesi pertamamu."
                  />
                </Card>
              ) : (
                <ul className="space-y-3">
                  {upcoming.slice(0, 5).map((b) => (
                    <li key={b.id} className="rounded-2xl border border-ink-200/80 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={b.mentor?.avatar_url} name={b.mentor?.full_name} size={40} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ink-950">{b.mentor?.full_name ?? "Mentor"}</p>
                          <p className="truncate text-xs text-ink-500">{b.subject?.name} · {b.topic}</p>
                        </div>
                        <div className="text-right text-xs text-ink-600">
                          <p className="font-semibold text-ink-900">{b.date}</p>
                          <p>{timeHM(b.start_time)}–{timeHM(b.end_time)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <aside>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-ink-950">Mentor Terakhir</h2>
              </div>
              {recentMentors.length === 0 ? (
                <Card>
                  <p className="text-sm text-ink-500">Belum ada mentor yang pernah kamu booking.</p>
                </Card>
              ) : (
                <ul className="space-y-2">
                  {recentMentors.map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/mentors/${b.mentor_id}`}
                        className="flex items-center gap-3 rounded-xl border border-ink-200/80 bg-white p-3 hover:border-brand-300"
                      >
                        <Avatar src={b.mentor?.avatar_url} name={b.mentor?.full_name} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink-900">{b.mentor?.full_name ?? "Mentor"}</p>
                          <p className="text-xs text-ink-400">{b.subject?.name}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-4">
                <p className="flex items-center gap-1.5 text-sm font-bold text-brand-800">
                  <Sparkles className="h-4 w-4" aria-hidden /> Tips
                </p>
                <p className="mt-1 text-xs leading-relaxed text-brand-900/80">
                  Jelaskan topik semaksimal mungkin saat mencari mentor agar skor kecocokan lebih akurat.
                </p>
              </div>
            </aside>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number;
}) {
  return (
    <Card className="flex items-center gap-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="text-2xl font-extrabold text-ink-950">{value}</p>
        <p className="text-xs font-medium text-ink-500">{label}</p>
      </div>
    </Card>
  );
}
