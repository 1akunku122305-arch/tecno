import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { findMentorMatches } from "@/services/matching.service";
import { getCategories, getSubjectById } from "@/services/catalog.service";
import { MatchCard } from "@/components/mentor/match-card";
import { LandingNavbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/sections";
import { EmptyState } from "@/components/ui/badge";
import { weightBreakdown } from "@/lib/matching/explain";
import { SearchX, Settings2 } from "lucide-react";
import type { MatchCriteria } from "@/types";

export const metadata: Metadata = { title: "Hasil Pencarian Mentor" };

export const dynamic = "force-dynamic";

interface SearchParams {
  category_id?: string;
  subject_id?: string;
  topic?: string;
  date?: string;
  start_time?: string;
  duration?: string;
  budget_min?: string;
  budget_max?: string;
}

export default async function MatchingResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const criteria: MatchCriteria = {
    category_id: params.category_id ?? null,
    subject_id: params.subject_id ?? null,
    topic: params.topic ?? "",
    date: params.date ?? null,
    start_time: params.start_time ?? null,
    duration_minutes: ([30, 60, 90].includes(Number(params.duration))
      ? Number(params.duration)
      : 60) as 30 | 60 | 90,
    budget_min: params.budget_min ? Number(params.budget_min) : null,
    budget_max: params.budget_max ? Number(params.budget_max) : null,
  };

  let matches: Awaited<ReturnType<typeof findMentorMatches>>["matches"] = [];
  let loadError: string | null = null;
  let subjectName: string | null = null;
  let categoryName: string | null = null;

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (configured) {
    try {
      const supabase = await createClient();
      const [result, subject, categories] = await Promise.all([
        findMentorMatches(supabase, criteria),
        criteria.subject_id ? getSubjectById(supabase, criteria.subject_id) : Promise.resolve(null),
        getCategories(supabase),
      ]);
      matches = result.matches;
      subjectName = subject?.name ?? null;
      categoryName =
        categories.find((c) => c.id === criteria.category_id)?.name ?? null;
    } catch (e) {
      loadError = e instanceof Error ? e.message : "Gagal memuat hasil.";
    }
  } else {
    loadError = "Supabase belum dikonfigurasi.";
  }

  return (
    <>
      <LandingNavbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink-950 sm:text-3xl">Hasil Pencarian</h1>
            <p className="mt-1 text-sm text-ink-500">
              {subjectName ?? categoryName ?? "Mentor"} · {criteria.topic || "Semua topik"} ·{" "}
              {criteria.date ? `${criteria.date} pukul ${criteria.start_time}` : "Jadwal fleksibel"} ·{" "}
              {criteria.duration_minutes} menit
              {criteria.budget_max !== null && ` · ≤ Rp ${criteria.budget_max.toLocaleString("id-ID")}`}
            </p>
          </div>
          <Link
            href="/find-mentor"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-none border border-ink-200 px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            <Settings2 className="h-4 w-4" aria-hidden /> Ubah Kebutuhan
          </Link>
        </div>

        {loadError && (
          <div className="mb-6 rounded-none border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-800">
            {loadError}
          </div>
        )}

        {!loadError && matches.length === 0 && (
          <EmptyState
            icon={<SearchX className="h-10 w-10" aria-hidden />}
            title="Belum ada mentor yang sesuai dengan kebutuhanmu."
            description="Coba ubah bidang, mata kuliah, topik, atau rentang budget — atau kembali lagi nanti saat lebih banyak mentor bergabung."
            action={
              <Link
                href="/find-mentor"
                className="inline-flex h-10 items-center justify-center rounded-none bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Ubah Kebutuhan
              </Link>
            }
          />
        )}

        {!loadError && matches.length > 0 && (
          <>
            <p className="mb-4 text-sm font-medium text-ink-600">
              Ditemukan <b className="text-ink-950">{matches.length} mentor</b> yang paling relevan,
              diurutkan berdasarkan skor kecocokan.
            </p>
            <div className="grid gap-5 lg:grid-cols-2">
              {matches.map((m) => (
                <MatchCard key={m.mentor.mentor_id} match={m} />
              ))}
            </div>

            <details className="mt-8 rounded-none border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm text-ink-600">
              <summary className="cursor-pointer font-semibold text-ink-800">
                Bagaimana skor kecocokan dihitung?
              </summary>
              <ul className="mt-3 space-y-1.5">
                {weightBreakdown().map((w) => (
                  <li key={w.key} className="flex justify-between border-b border-ink-200/60 pb-1.5">
                    <span>{w.label}</span>
                    <b>{w.pct}%</b>
                  </li>
                ))}
                <li className="pt-1 text-xs text-ink-400">
                  Skor dihitung dari data nyata: mata kuliah, topik, ketersediaan, budget, rating, dan pengalaman.
                </li>
              </ul>
            </details>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
