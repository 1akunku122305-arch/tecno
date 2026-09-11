import type { Metadata } from "next";
import Link from "next/link";
import { getAuthContext } from "@/lib/auth/session";
import { getBookingsForDashboard } from "@/services/booking.service";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { Badge, EmptyState } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { timeHM, todayISO, formatPrice } from "@/lib/utils";
import { CalendarClock, CheckCircle2, Inbox, ShieldCheck, Star } from "lucide-react";

export const metadata: Metadata = { title: "Mentor Dashboard" };
export const dynamic = "force-dynamic";

export default async function MentorDashboardPage() {
  const { supabase, user, profile } = await getAuthContext();
  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let bookings: Awaited<ReturnType<typeof getBookingsForDashboard>> = [];
  let reviewsData: { mentor_id: string; rating: number }[] = [];
  if (configured && user && mentor) {
    const [b, r] = await Promise.all([
      getBookingsForDashboard(supabase, user.id, "mentor"),
      supabase.from("reviews").select("mentor_id, rating").eq("mentor_id", mentor.id),
    ]);
    bookings = b;
    reviewsData = (r.data ?? []) as { mentor_id: string; rating: number }[];
  }

  const today = todayISO();
  const pending = bookings.filter((b) => b.status === "pending");
  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.date >= today);
  const completed = bookings.filter((b) => b.status === "completed");
  const avgRating =
    reviewsData.length > 0
      ? Number((reviewsData.reduce((s, r) => s + r.rating, 0) / reviewsData.length).toFixed(1))
      : null;

  return (
    <>
      {!configured && <SetupPanel />}
      {configured && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-none bg-gradient-to-r from-ink-900 to-ink-800 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold">Halo, {profile?.full_name ?? "Mentor"} 👋</h1>
                <Badge tone={mentor?.status === "approved" ? "green" : mentor?.status === "rejected" ? "red" : "amber"}>
                  {mentor?.status === "approved"
                    ? "Verified Mentor"
                    : mentor?.status === "rejected"
                      ? "Ditolak"
                      : "Menunggu Verifikasi"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ink-300">
                {mentor?.status === "approved"
                  ? "Mentormu terverifikasi dan tampil di hasil pencarian."
                  : "Lengkapi profil dan harga untuk mengajukan verifikasi admin."}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/mentor/profile" className="inline-flex h-10 items-center rounded-none bg-white px-4 text-sm font-bold text-ink-900 hover:bg-ink-100">
                Edit Profil
              </Link>
              {mentor?.status !== "approved" && (
                <Link href="/mentor/profile#verifikasi" className="inline-flex h-10 items-center gap-1.5 rounded-none bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700">
                  <ShieldCheck className="h-4 w-4" aria-hidden /> Ajukan Verifikasi
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Inbox} label="Booking Pending" value={pending.length} />
            <StatCard icon={CalendarClock} label="Sesi Mendatang" value={upcoming.length} />
            <StatCard icon={CheckCircle2} label="Total Sesi Selesai" value={completed.length} />
            <StatCard
              icon={Star}
              label="Rating"
              value={avgRating ? `${avgRating} ⭐` : "—"}
              sub={`${reviewsData.length} ulasan`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-ink-950">Permintaan Booking Baru</h2>
                <Link href="/mentor/bookings" className="text-sm font-semibold text-brand-600 hover:underline">
                  Semua booking
                </Link>
              </div>
              {pending.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<Inbox className="h-9 w-9" aria-hidden />}
                    title="Tidak ada permintaan pending."
                    description="Permintaan booking baru akan muncul di sini."
                  />
                </Card>
              ) : (
                <ul className="space-y-3">
                  {pending.slice(0, 5).map((b) => (
                    <li key={b.id} className="flex items-center gap-3 rounded-none border border-ink-200/80 bg-white p-4">
                      <Avatar src={b.student?.avatar_url} name={b.student?.full_name} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink-950">{b.student?.full_name ?? "Mahasiswa"}</p>
                        <p className="truncate text-xs text-ink-500">
                          {b.subject?.name} · {b.date} {timeHM(b.start_time)} · {formatPrice(b.price)}
                        </p>
                      </div>
                      <Link href="/mentor/bookings" className="text-xs font-semibold text-brand-600 hover:underline">
                        Proses →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-ink-950">Sesi Mendatang</h2>
                <Link href="/mentor/sessions" className="text-sm font-semibold text-brand-600 hover:underline">
                  Semua sesi
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<CalendarClock className="h-9 w-9" aria-hidden />}
                    title="Belum ada sesi mendatang."
                    description="Terima booking untuk mengisi jadwalmu."
                  />
                </Card>
              ) : (
                <ul className="space-y-3">
                  {upcoming.slice(0, 5).map((b) => (
                    <li key={b.id} className="rounded-none border border-ink-200/80 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-ink-950">{b.topic}</p>
                          <p className="text-xs text-ink-500">{b.student?.full_name ?? "Mahasiswa"} · {b.subject?.name}</p>
                        </div>
                        <p className="text-right text-xs font-semibold text-ink-800">
                          {b.date}
                          <br />
                          {timeHM(b.start_time)}–{timeHM(b.end_time)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card className="flex items-center gap-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-none bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="text-2xl font-extrabold text-ink-950">{value}</p>
        <p className="text-xs font-medium text-ink-500">{sub ?? label}</p>
      </div>
    </Card>
  );
}
