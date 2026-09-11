import type { Metadata } from "next";
import { getCategories } from "@/services/catalog.service";
import { createClient } from "@/lib/supabase/server";
import { FindMentorForm } from "@/components/find-mentor-form";
import { LandingNavbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/sections";

export const metadata: Metadata = { title: "Cari Mentor" };
export const dynamic = "force-dynamic";

export default async function FindMentorPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let loadError: string | null = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      categories = await getCategories(supabase);
    } catch (e) {
      loadError = e instanceof Error ? e.message : "Gagal memuat data.";
    }
  } else {
    loadError = "Supabase belum dikonfigurasi.";
  }

  return (
    <>
      <LandingNavbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-ink-950 sm:text-4xl">Cari Mentor</h1>
          <p className="mt-2 text-ink-600">
            Jelaskan kebutuhan akademikmu — kami akan mencocokkan mentor yang paling sesuai.
          </p>
        </div>

        {loadError && (
          <div className="mb-6 rounded-none border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-800">
            {loadError}
          </div>
        )}

        <FindMentorForm categories={categories} />
      </main>
      <Footer />
    </>
  );
}
