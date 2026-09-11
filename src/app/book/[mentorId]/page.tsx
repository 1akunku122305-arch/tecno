import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth/guards";
import { getMentorListItem } from "@/services/mentor.service";
import { BookingForm } from "@/components/booking/booking-form";
import { EmptyState } from "@/components/ui/badge";
import { SearchX } from "lucide-react";

export const metadata: Metadata = { title: "Booking Sesi" };
export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ mentorId: string }>;
  searchParams: Promise<{ subject_id?: string }>;
}) {
  const { mentorId } = await params;
  const { subject_id } = await searchParams;

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (!configured) {
    redirect("/login?next=/book/" + encodeURIComponent(mentorId));
  }

  const { supabase } = await requireStudent();

  let mentor = null;
  let error: string | null = null;

  try {
    mentor = await getMentorListItem(supabase, mentorId);
  } catch (e) {
    error = e instanceof Error ? e.message : "Gagal memuat data.";
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold text-ink-950 sm:text-3xl">Booking Sesi Konsultasi</h1>
        <p className="mt-1 text-sm text-ink-500">Pilih jadwal, isi kebutuhanmu, lalu konfirmasi.</p>
      </div>

      {error && (
        <div className="rounded-none border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-800">
          {error}
        </div>
      )}

      {!error && !mentor && (
        <EmptyState
          icon={<SearchX className="h-10 w-10" aria-hidden />}
          title="Mentor tidak ditemukan."
          action={<a href="/find-mentor" className="text-sm font-semibold text-brand-600 hover:underline">Kembali ke pencarian</a>}
        />
      )}

      {!error && mentor && (
        <>
          {mentor.status !== "approved" && (
            <div className="mb-5 rounded-none border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-800">
              Mentor ini belum terverifikasi dan tidak dapat di-booking.
            </div>
          )}
          <BookingForm
            mentor={mentor}
            // Only the subjects this mentor actually teaches (keeps the
            // server-side subject-ownership validation in sync with the UI).
            subjects={mentor.subjects}
            initialSubjectId={
              subject_id && mentor.subjects.some((s) => s.id === subject_id) ? subject_id : undefined
            }
          />
        </>
      )}
    </main>
  );
}
