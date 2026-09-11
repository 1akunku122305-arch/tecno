import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getSubjects } from "@/services/catalog.service";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { SubjectManager } from "@/components/admin/subject-manager";

export const metadata: Metadata = { title: "Kelola Mata Kuliah" };
export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
  const supabase = await createClient();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [categories, subjects] = configured
    ? await Promise.all([
        getCategories(supabase, { includeInactive: true }),
        getSubjects(supabase, undefined, { includeInactive: true }),
      ])
    : [[], []];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-950">Mata Kuliah</h1>
        <p className="mt-1 text-sm text-ink-500">
          Mata kuliah selalu terhubung ke kategori — tambah tanpa mengubah kode.
        </p>
      </div>
      {configured ? <SubjectManager categories={categories} subjects={subjects} /> : <SetupPanel />}

    </>
  );
}
