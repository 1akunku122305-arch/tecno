import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

/**
 * Landing-page catalog read that NEVER crashes the page:
 * if Supabase env vars are missing or the query fails (e.g. during local
 * preview without a project), it returns an empty list so the UI shows a
 * professional empty state instead of a 500.
 */
export async function getPublicCategoriesSafe(): Promise<{ categories: Category[]; error: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || !url.startsWith("https://")) {
    return { categories: [], error: "Supabase belum dikonfigurasi." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) return { categories: [], error: error.message };
    return { categories: (data ?? []) as Category[], error: null };
  } catch (e) {
    return { categories: [], error: e instanceof Error ? e.message : "Gagal memuat data." };
  }
}
