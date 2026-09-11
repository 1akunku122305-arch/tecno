import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/services/catalog.service";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Kelola Kategori" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const categories = configured ? await getCategories(supabase, { includeInactive: true }) : [];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-950">Kategori Bidang</h1>
        <p className="mt-1 text-sm text-ink-500">
          Tambah bidang akademik baru — platform otomatis mendukungnya tanpa ubah arsitektur.
        </p>
      </div>
      {configured ? <CategoryManager categories={categories} /> : <SetupPanel />}

    </>
  );
}
