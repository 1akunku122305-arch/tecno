import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, MentorStatus, Subject, UserRole } from "@/types";
import { friendlyDbError, slugify } from "@/lib/utils";

/** Human-readable message for FK violations (data still referenced elsewhere). */
function fkBlockedError(action: string): Error {
  return new Error(
    `${action}: data masih terkait record lain (mis. booking atau relasi mentor). Nonaktifkan saja bila ragu.`
  );
}

// ---------------------------------------------------------------------------
// Admin service — every mutation is guarded by RLS (is_admin()).
// ---------------------------------------------------------------------------

export interface AdminStats {
  totalStudents: number;
  totalMentors: number;
  pendingMentors: number;
  verifiedMentors: number;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  categories: number;
  subjects: number;
  totalReviews: number;
}

export async function getAdminStats(supabase: SupabaseClient): Promise<AdminStats> {
  const [
    students,
    mentors,
    pending,
    verified,
    bookings,
    active,
    completed,
    categories,
    subjects,
    reviews,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student" as UserRole),
    supabase
      .from("mentor_profiles")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("mentor_profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending" as MentorStatus),
    supabase
      .from("mentor_profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved" as MentorStatus),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("subjects").select("id", { count: "exact", head: true }),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
  ]);

  return {
    totalStudents: students.count ?? 0,
    totalMentors: mentors.count ?? 0,
    pendingMentors: pending.count ?? 0,
    verifiedMentors: verified.count ?? 0,
    totalBookings: bookings.count ?? 0,
    activeBookings: active.count ?? 0,
    completedBookings: completed.count ?? 0,
    categories: categories.count ?? 0,
    subjects: subjects.count ?? 0,
    totalReviews: reviews.count ?? 0,
  };
}

export async function listUsers(supabase: SupabaseClient, role?: UserRole) {
  let q = supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, university, major, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (role) q = q.eq("role", role);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listMentorsForAdmin(supabase: SupabaseClient, status?: MentorStatus) {
  let q = supabase
    .from("mentor_profiles")
    .select("*, profile:profiles!mentor_profiles_user_id_fkey(full_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function setMentorStatus(
  supabase: SupabaseClient,
  mentorId: string,
  status: MentorStatus
) {
  const { error } = await supabase
    .from("mentor_profiles")
    .update({ status })
    .eq("id", mentorId)
    .select("id");
  if (error)
    throw friendlyDbError(error, "Profil mentor tidak ditemukan atau tidak dapat diubah.");
  return { ok: true };
}

export async function setUserRole(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole
) {
  if (role === "admin") throw new Error("Role admin tidak dapat diberikan melalui UI.");

  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();
  if (readError || !existing) throw new Error("Pengguna tidak ditemukan.");
  if (existing.role === role) return { ok: true }; // no-op (jaga-jaga status reset)

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select("id");
  if (error)
    throw friendlyDbError(error, "Pengguna tidak ditemukan atau perannya tidak dapat diubah.");

  // Keep mentor onboarding consistent after a role change:
  //  - ...→ mentor: ensure a mentor_profiles row exists so the onboarding
  //    page works immediately (trigger handle_new_user only creates it for
  //    accounts that registered AS mentor).
  //  - mentor→...: force re-verification so a demoted account doesn't keep
  //    showing up publicly as an "approved" mentor.
  if (role === "mentor") {
    const { error: mpError } = await supabase
      .from("mentor_profiles")
      .upsert(
        { user_id: userId, status: "pending" },
        { onConflict: "user_id", ignoreDuplicates: true }
      );
    if (mpError) throw new Error(`Gagal menyiapkan profil mentor: ${mpError.message}`);
  } else {
    await supabase
      .from("mentor_profiles")
      .update({ status: "pending" })
      .eq("user_id", userId);
  }
  return { ok: true };
}

// --- Categories -------------------------------------------------------------

export async function createCategory(
  supabase: SupabaseClient,
  input: { name: string; slug?: string; description?: string; icon?: string }
): Promise<Category> {
  const name = input.name.trim();
  if (name.length < 2) throw new Error("Nama kategori minimal 2 karakter.");
  const slug = input.slug?.trim() || slugify(name);

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, slug, description: input.description?.trim() || null, icon: input.icon?.trim() || null })
    .select("*")
    .single();
  if (error) throw new Error(`Gagal menambah kategori: ${error.message}`);
  return data as Category;
}

export async function updateCategory(
  supabase: SupabaseClient,
  id: string,
  input: { name?: string; description?: string; icon?: string; isActive?: boolean }
) {
  const { error } = await supabase.from("categories").update(input).eq("id", id).select("id");
  if (error) throw friendlyDbError(error, "Kategori tidak ditemukan atau tidak dapat diubah.");
  return { ok: true };
}

export async function deleteCategory(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id).select("id");
  if (error) {
    if (error.code === "23503") throw fkBlockedError("Gagal menghapus kategori");
    throw friendlyDbError(error, "Kategori tidak ditemukan atau tidak dapat dihapus.");
  }
  return { ok: true };
}

// --- Subjects -----------------------------------------------------------------

export async function createSubject(
  supabase: SupabaseClient,
  input: { categoryId: string; name: string; description?: string }
): Promise<Subject> {
  const name = input.name.trim();
  if (name.length < 2) throw new Error("Nama mata kuliah minimal 2 karakter.");
  const slug = slugify(name);

  const { data, error } = await supabase
    .from("subjects")
    .insert({ category_id: input.categoryId, name, slug, description: input.description?.trim() || null })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("Mata kuliah sudah ada dalam kategori tersebut.");
    throw new Error(`Gagal menambah mata kuliah: ${error.message}`);
  }
  return data as Subject;
}

export async function updateSubject(
  supabase: SupabaseClient,
  id: string,
  input: { name?: string; description?: string; isActive?: boolean; categoryId?: string }
) {
  const patch: Record<string, unknown> = { ...input };
  if (input.name) {
    patch.name = input.name.trim();
    patch.slug = slugify(input.name);
  }
  const { error } = await supabase.from("subjects").update(patch).eq("id", id).select("id");
  if (error)
    throw friendlyDbError(error, "Mata kuliah tidak ditemukan atau tidak dapat diubah.");
  return { ok: true };
}

export async function deleteSubject(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("subjects").delete().eq("id", id).select("id");
  if (error) {
    if (error.code === "23503") throw fkBlockedError("Gagal menghapus mata kuliah");
    throw friendlyDbError(error, "Mata kuliah tidak ditemukan atau tidak dapat dihapus.");
  }
  return { ok: true };
}

export async function listBookingsAdmin(supabase: SupabaseClient, limit = 100) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, subject:subjects(name), mentor:mentor_profiles(id, profile:profiles!mentor_profiles_user_id_fkey(full_name)), student:profiles!bookings_student_id_fkey(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
