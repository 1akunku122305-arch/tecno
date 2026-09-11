import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listBookingsAdmin } from "@/services/admin.service";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/badge";
import { BOOKING_STATUS_LABEL, formatPrice, timeHM } from "@/lib/utils";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Booking" };
export const dynamic = "force-dynamic";

const tone: Record<string, string> = {
  pending: "bg-ink-100 text-ink-800",
  confirmed: "bg-ink-100 text-ink-800",
  completed: "bg-brand-100 text-brand-800",
  rejected: "bg-ink-100 text-ink-700",
  cancelled: "bg-ink-100 text-ink-600",
};

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const bookings = configured ? await listBookingsAdmin(supabase, 200) : [];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-950">Booking</h1>
        <p className="mt-1 text-sm text-ink-500">{bookings.length} booking terakhir.</p>
      </div>

      {!configured && <SetupPanel />}
      {configured && bookings.length === 0 && (
        <EmptyState icon={<BookOpen className="h-10 w-10" aria-hidden />} title="Belum ada booking." />
      )}
      {configured && bookings.length > 0 && (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-ink-100 text-xs uppercase text-ink-400">
                <tr>
                  <th className="px-4 py-3">Mentor</th>
                  <th className="px-4 py-3">Mahasiswa</th>
                  <th className="px-4 py-3">Mata Kuliah</th>
                  <th className="px-4 py-3">Topik</th>
                  <th className="px-4 py-3">Jadwal</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: any) => (
                  <tr key={b.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-3 font-semibold text-ink-900">{b.mentor?.profile?.full_name ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-600">{b.student?.full_name ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-600">{b.subject?.name ?? "-"}</td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-ink-500" title={b.topic}>{b.topic}</td>
                    <td className="px-4 py-3 text-ink-600">
                      {b.date} {timeHM(b.start_time)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink-900">{formatPrice(b.price)}</td>
                    <td className="px-4 py-3">
                      <span className={"rounded-none px-2.5 py-0.5 text-xs font-semibold " + (tone[b.status] ?? "bg-ink-100 text-ink-600")}>
                        {BOOKING_STATUS_LABEL[b.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

    </>
  );
}
