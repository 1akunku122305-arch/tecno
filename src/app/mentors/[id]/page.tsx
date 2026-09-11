import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMentorDetail, getMentorSubjects } from "@/services/mentor.service";
import { Avatar } from "@/components/avatar";
import { Badge, EmptyState } from "@/components/ui/badge";
import { Stars } from "@/components/mentor/stars";
import { dayName, formatDate, formatPrice } from "@/lib/utils";
import { BookCheck, CalendarDays, GraduationCap, ShieldCheck, UserX } from "lucide-react";

export const metadata: Metadata = { title: "Profil Mentor" };
export const dynamic = "force-dynamic";

export default async function MentorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const supabase = configured ? await createClient() : null;

  let mentor = null;
  let topics: Awaited<ReturnType<typeof getMentorDetail>>["topics"] = [];
  let reviews: Awaited<ReturnType<typeof getMentorDetail>>["reviews"] = [];
  let subjects: Awaited<ReturnType<typeof getMentorSubjects>> = [];
  let error: string | null = null;

  if (configured && supabase) {
    try {
      const [detail, subjRes] = await Promise.all([
        getMentorDetail(supabase, id),
        getMentorSubjects(supabase, id),
      ]);
      mentor = detail.mentor;
      topics = detail.topics;
      reviews = detail.reviews;
      subjects = subjRes;
    } catch (e) {
      error = e instanceof Error ? e.message : "Gagal memuat data.";
    }
  } else {
    error = "Supabase belum dikonfigurasi.";
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-ink-500" aria-label="Breadcrumb">
        <Link href="/find-mentor" className="hover:text-brand-600">Cari Mentor</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-ink-800">{mentor?.full_name ?? "Profil"}</span>
      </nav>

      {error && (
        <div className="rounded-none border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-800">
          {error}
        </div>
      )}

      {!error && !mentor && (
        <EmptyState
          icon={<UserX className="h-10 w-10" aria-hidden />}
          title="Mentor tidak ditemukan."
          action={
            <Link href="/find-mentor" className="text-sm font-semibold text-brand-600 hover:underline">
              Cari mentor lain
            </Link>
          }
        />
      )}

      {!error && mentor && (
        <>
          {/* Header */}
          <section className="rounded-none border border-ink-200/80 bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <Avatar src={mentor.avatar_url} name={mentor.full_name} size={96} />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-ink-950">{mentor.full_name ?? "Mentor"}</h1>
                  {mentor.status === "approved" && (
                    <Badge tone="brand"><ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Verified Mentor</Badge>
                  )}
                </div>
                {mentor.headline && <p className="mt-1 text-ink-600">{mentor.headline}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-600">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-ink-900">
                    <Stars rating={mentor.avg_rating} />
                    {mentor.avg_rating ? mentor.avg_rating.toFixed(1) : "Belum ada rating"}
                    {mentor.review_count > 0 && <span className="font-normal text-ink-400">({mentor.review_count} ulasan)</span>}
                  </span>
                  <span>{mentor.completed_sessions} sesi selesai</span>
                  <span>{mentor.years_experience} tahun pengalaman</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {mentor.category_name && <Badge tone="brand">{mentor.category_name}</Badge>}
                  {subjects.map((s) => (
                    <Badge key={s.id} tone="gray">{s.name}</Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-none bg-ink-50 p-4 text-center sm:text-right">
                <p className="text-2xl font-extrabold text-ink-950">{formatPrice(mentor.price_per_session)}</p>
                <p className="text-xs text-ink-400">per sesi</p>
                {mentor.status === "approved" ? (
                  <Link
                    href={`/book/${mentor.mentor_id}`}
                    className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-none bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 sm:w-auto"
                  >
                    <BookCheck className="h-4 w-4" aria-hidden /> Booking Sesi
                  </Link>
                ) : (
                  <p className="mt-3 text-xs text-ink-600">Belum dapat di-booking (menunggu verifikasi)</p>
                )}
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-none border border-ink-200/80 bg-white p-6">
                <h2 className="font-bold text-ink-950">Tentang</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-600">
                  {mentor.bio || "Mentor belum menulis bio."}
                </p>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <p className="flex items-center gap-2 text-ink-600">
                    <GraduationCap className="h-4 w-4 text-brand-600" aria-hidden />
                    {mentor.university ?? "Universitas belum diisi"} {mentor.major && `· ${mentor.major}`}
                  </p>
                </div>
              </section>

              <section className="rounded-none border border-ink-200/80 bg-white p-6">
                <h2 className="font-bold text-ink-950">Bidang yang diajarkan</h2>
                {subjects.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <li key={s.id}><Badge tone="gray">{s.name}</Badge></li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-500">Belum ada mata kuliah yang dipilih.</p>
                )}

                {topics.length > 0 && (
                  <>
                    <h3 className="mt-5 text-sm font-semibold text-ink-800">Topik khusus</h3>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {topics.slice(0, 12).map((t) => (
                        <li key={t.id} className="rounded-none border border-ink-200 px-3 py-1 text-xs text-ink-600">
                          {t.name}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>

              <section className="rounded-none border border-ink-200/80 bg-white p-6">
                <h2 className="font-bold text-ink-950">Ulasan dari mahasiswa</h2>
                {reviews.length > 0 ? (
                  <ul className="mt-4 space-y-4">
                    {reviews.map((r) => (
                      <li key={r.id} className="border-b border-ink-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar src={r.reviewer?.avatar_url} name={r.reviewer?.full_name} size={28} />
                            <span className="text-sm font-semibold text-ink-900">
                              {r.reviewer?.full_name ?? "Mahasiswa"}
                            </span>
                          </div>
                          <span className="text-xs text-ink-400">{formatDate(r.created_at)}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Stars rating={r.rating} />
                          <span className="text-xs font-semibold text-ink-700">{r.rating}/5</span>
                        </div>
                        {r.review && <p className="mt-1.5 text-sm text-ink-600">{r.review}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-500">Belum ada review.</p>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-none border border-ink-200/80 bg-white p-6">
                <h2 className="flex items-center gap-2 font-bold text-ink-950">
                  <CalendarDays className="h-4 w-4 text-brand-600" aria-hidden /> Jadwal tersedia
                </h2>
                {mentor.availability.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {mentor.availability.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-none bg-ink-50 px-3 py-2 text-sm"
                      >
                        <span className="font-semibold text-ink-800">{dayName(a.day_of_week)}</span>
                        <span className="text-ink-500">{a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-500">Jadwal belum diatur.</p>
                )}
              </section>

              <section className="rounded-none border border-brand-200 bg-brand-50 p-5 text-sm text-brand-800">
                <p className="font-bold">Cara booking</p>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-brand-900/80">
                  <li>Pilih tanggal & waktu</li>
                  <li>Isi topik dan catatan</li>
                  <li>Konfirmasi booking</li>
                  <li>Terima link meeting setelah mentor menyetujui</li>
                </ol>
              </section>
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
