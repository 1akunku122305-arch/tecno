"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createCategory,
  createSubject,
  deleteCategory,
  deleteSubject,
  setMentorStatus,
  setUserRole,
  updateCategory,
  updateSubject,
} from "./admin.service";
import type { MentorStatus, UserRole } from "@/types";

// ---------------------------------------------------------------------------
// Admin server actions — all guarded by RLS is_admin() in the database.
// ---------------------------------------------------------------------------

type AdminActionResponse = { ok: boolean; error?: string };

export async function approveMentorAction(mentorId: string): Promise<AdminActionResponse> {
  const supabase = await createClient();
  try {
    await setMentorStatus(supabase, mentorId, "approved");
    revalidatePath("/admin/mentors");
    revalidatePath("/admin/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memperbarui status." };
  }
}

export async function rejectMentorAction(mentorId: string): Promise<AdminActionResponse> {
  const supabase = await createClient();
  try {
    await setMentorStatus(supabase, mentorId, "rejected");
    revalidatePath("/admin/mentors");
    revalidatePath("/admin/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memperbarui status." };
  }
}

export async function setUserRoleAction(userId: string, role: UserRole): Promise<AdminActionResponse> {
  const supabase = await createClient();
  try {
    await setUserRole(supabase, userId, role);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal mengubah peran." };
  }
}

export async function createCategoryAction(input: {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
}): Promise<AdminActionResponse> {
  const supabase = await createClient();
  try {
    await createCategory(supabase, input);
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menambah kategori." };
  }
}

export async function updateCategoryAction(
  id: string,
  input: { name?: string; description?: string; icon?: string; isActive?: boolean }
): Promise<AdminActionResponse> {
  const supabase = await createClient();
  try {
    await updateCategory(supabase, id, input);
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memperbarui kategori." };
  }
}

export async function deleteCategoryAction(id: string): Promise<AdminActionResponse> {
  const supabase = await createClient();
  try {
    await deleteCategory(supabase, id);
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menghapus kategori." };
  }
}

export async function createSubjectAction(input: {
  categoryId: string;
  name: string;
  description?: string;
}): Promise<AdminActionResponse> {
  const supabase = await createClient();
  try {
    await createSubject(supabase, input);
    revalidatePath("/admin/subjects");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menambah mata kuliah." };
  }
}

export async function updateSubjectAction(
  id: string,
  input: { name?: string; description?: string; isActive?: boolean; categoryId?: string }
): Promise<AdminActionResponse> {
  const supabase = await createClient();
  try {
    await updateSubject(supabase, id, input);
    revalidatePath("/admin/subjects");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memperbarui mata kuliah." };
  }
}

export async function deleteSubjectAction(id: string): Promise<AdminActionResponse> {
  const supabase = await createClient();
  try {
    await deleteSubject(supabase, id);
    revalidatePath("/admin/subjects");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menghapus mata kuliah." };
  }
}

export async function resetMentorStatusAction(mentorId: string, status: MentorStatus): Promise<AdminActionResponse> {
  const supabase = await createClient();
  try {
    await setMentorStatus(supabase, mentorId, status);
    revalidatePath("/admin/mentors");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memperbarui status." };
  }
}
