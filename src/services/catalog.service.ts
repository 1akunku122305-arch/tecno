import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, Subject, Topic } from "@/types";

// ---------------------------------------------------------------------------
// Catalog service — categories & subjects always come from the database.
// Never hardcode academic fields in the UI.
// ---------------------------------------------------------------------------

export async function getCategories(
  supabase: SupabaseClient,
  options: { includeInactive?: boolean } = {}
): Promise<Category[]> {
  let query = supabase.from("categories").select("*").order("name", { ascending: true });
  if (!options.includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw new Error(`Gagal memuat kategori: ${error.message}`);
  return data ?? [];
}

export async function getSubjects(
  supabase: SupabaseClient,
  categoryId?: string,
  options: { includeInactive?: boolean } = {}
): Promise<Subject[]> {
  let query = supabase.from("subjects").select("*").order("name", { ascending: true });
  if (categoryId) query = query.eq("category_id", categoryId);
  if (!options.includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw new Error(`Gagal memuat mata kuliah: ${error.message}`);
  return data ?? [];
}

export async function getTopics(
  supabase: SupabaseClient,
  subjectId: string
): Promise<Topic[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("subject_id", subjectId)
    .order("name", { ascending: true });
  if (error) throw new Error(`Gagal memuat topik: ${error.message}`);
  return data ?? [];
}

export async function getCategoryById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getSubjectById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase.from("subjects").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
