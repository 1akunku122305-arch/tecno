"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MentorStatus } from "@/types";
import { friendlyDbError, slugify } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Mentor profile writes (server actions). A mentor manages only their own
// profile/subjects/availability — RLS enforces ownership at the DB layer.
// ---------------------------------------------------------------------------

export interface ActionResponse {
  ok: boolean;
  error?: string;
}

type OwnMentor = { id: string; status: MentorStatus; price_per_session: number };

/**
 * Get the current user's mentor_profiles row, creating it when missing.
 *
 * A mentor-role account can exist WITHOUT a mentor_profiles row when the role
 * was granted via raw SQL (the handle_new_user trigger only fires on
 * auth.users INSERT) or the account registered before the migration ran.
 * Auto-creating keeps the onboarding flow self-healing instead of failing
 * with a confusing "Profil mentor tidak ditemukan" error.
 */
async function requireOwnMentor(
  supabase: SupabaseClient,
  userId: string
): Promise<OwnMentor> {
  const { data: existing } = await supabase
    .from("mentor_profiles")
    .select("id, status, price_per_session")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing as OwnMentor;

  const { data: created, error } = await supabase
    .from("mentor_profiles")
    .insert({ user_id: userId, status: "pending" })
    .select("id, status, price_per_session")
    .single();
  if (error || !created) {
    throw new Error(
      "Profil mentor belum ada dan gagal dibuat otomatis. " +
        "Pastikan akun ini ber-role mentor, lalu coba lagi."
    );
  }
  return created as OwnMentor;
}

/**
 * Explicit "Buat Profil Mentor" action for the profile page empty state.
 * Idempotent: returns ok when the row already exists.
 */
export async function ensureMentorProfile(): Promise<ActionResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan login terlebih dahulu." };

  try {
    await requireOwnMentor(supabase, user.id);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal membuat profil mentor." };
  }

  revalidatePath("/mentor/profile");
  revalidatePath("/mentor/dashboard");
  revalidatePath("/mentor/schedule");
  return { ok: true };
}

export interface MentorProfileInput {
  headline?: string;
  bio?: string;
  university?: string;
  major?: string;
  yearsExperience?: number;
  pricePerSession?: number;
  categoryId?: string | null;
  meetingUrl?: string | null;
}

export async function saveMentorProfile(input: MentorProfileInput): Promise<ActionResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan login terlebih dahulu." };

  const { data: existing } = await supabase
    .from("mentor_profiles")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Profil mentor tidak ditemukan." };

  const patch: Record<string, unknown> = {
    headline: input.headline?.trim() || null,
    bio: input.bio?.trim() || null,
    university: input.university?.trim() || null,
    major: input.major?.trim() || null,
    years_experience: Math.max(0, Number(input.yearsExperience ?? 0) || 0),
    price_per_session: Math.max(0, Number(input.pricePerSession ?? 0) || 0),
    category_id: input.categoryId || null,
    meeting_url: input.meetingUrl?.trim() || null,
  };

  const { error } = await supabase.from("mentor_profiles").update(patch).eq("id", mentor.id);
  if (error) return { ok: false, error: `Gagal menyimpan profil mentor: ${error.message}` };

  revalidatePath("/mentor/dashboard");
  revalidatePath("/mentor/profile");
  return { ok: true };
}

export async function saveMentorSubjects(subjectIds: string[]): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan login terlebih dahulu." };

  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mentor) return { ok: false, error: "Profil mentor tidak ditemukan." };
  if (subjectIds.length === 0) return { ok: false, error: "Pilih minimal satu mata kuliah." };

  const { error: delErr } = await supabase
    .from("mentor_subjects")
    .delete()
    .eq("mentor_id", mentor.id);
  if (delErr) return { ok: false, error: `Gagal memperbarui mata kuliah: ${delErr.message}` };

  const rows = subjectIds.map((subjectId) => ({ mentor_id: mentor.id, subject_id: subjectId }));
  const { error } = await supabase.from("mentor_subjects").insert(rows);
  if (error) return { ok: false, error: `Gagal menyimpan mata kuliah: ${error.message}` };

  revalidatePath("/mentor/profile");
  return { ok: true };
}

export async function saveMentorTopics(topicNames: string[], subjectId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan login terlebih dahulu." };

  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mentor) return { ok: false, error: "Profil mentor tidak ditemukan." };

  const names = [...new Set(topicNames.map((t) => t.trim()).filter(Boolean))];
  if (names.length === 0) return { ok: false, error: "Tambahkan minimal satu topik." };

  const { error: delErr } = await supabase
    .from("mentor_topics")
    .delete()
    .eq("mentor_id", mentor.id);
  if (delErr) return { ok: false, error: `Gagal memperbarui topik: ${delErr.message}` };

  const topicIds: string[] = [];
  for (const name of names) {
    const slug = slugify(name);
    const { data: existing } = await supabase
      .from("topics")
      .select("id")
      .eq("subject_id", subjectId)
      .eq("name", name)
      .maybeSingle();

    let topicId = existing?.id;
    if (!topicId) {
      const { data: created } = await supabase
        .from("topics")
        .insert({ subject_id: subjectId, name })
        .select("id")
        .single();
      topicId = created?.id;
      if (!topicId) continue;
    }
    topicIds.push(topicId);
  }

  if (topicIds.length > 0) {
    const { error } = await supabase
      .from("mentor_topics")
      .insert(topicIds.map((topicId) => ({ mentor_id: mentor.id, topic_id: topicId })));
    if (error) return { ok: false, error: `Gagal menyimpan topik: ${error.message}` };
  }
  revalidatePath("/mentor/profile");
  return { ok: true };
}

export interface AvailabilityInput {
  dayOfWeek: number;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isAvailable?: boolean;
}

export async function saveAvailability(input: AvailabilityInput): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan login terlebih dahulu." };

  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mentor) return { ok: false, error: "Profil mentor tidak ditemukan." };

  const startMin = toMin(input.startTime);
  const endMin = toMin(input.endTime);
  if (endMin <= startMin) return { ok: false, error: "Waktu selesai harus setelah waktu mulai." };
  if (input.dayOfWeek < 0 || input.dayOfWeek > 6) return { ok: false, error: "Hari tidak valid." };

  const { error } = await supabase.from("mentor_availability").insert({
    mentor_id: mentor.id,
    day_of_week: input.dayOfWeek,
    start_time: `${input.startTime}:00`,
    end_time: `${input.endTime}:00`,
    is_available: input.isAvailable ?? true,
  });
  if (error) return { ok: false, error: `Gagal menyimpan jadwal: ${error.message}` };

  revalidatePath("/mentor/schedule");
  return { ok: true };
}

export async function deleteAvailability(availabilityId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan login terlebih dahulu." };

  const { error } = await supabase
    .from("mentor_availability")
    .delete()
    .eq("id", availabilityId);
  if (error) return { ok: false, error: `Gagal menghapus jadwal: ${error.message}` };

  revalidatePath("/mentor/schedule");
  return { ok: true };
}

export async function toggleAvailability(availabilityId: string, isAvailable: boolean): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan login terlebih dahulu." };

  const { error } = await supabase
    .from("mentor_availability")
    .update({ is_available: !isAvailable })
    .eq("id", availabilityId)
    .select("id");
  if (error)
    return { ok: false, error: friendlyDbError(error, "Jadwal tidak ditemukan.").message };
  revalidatePath("/mentor/schedule");
  return { ok: true };
}

export async function submitMentorForReview(): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan login terlebih dahulu." };

  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("id, status, price_per_session")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mentor) return { ok: false, error: "Profil mentor tidak ditemukan." };
  if (mentor.price_per_session <= 0)
    return { ok: false, error: "Atur harga per sesi sebelum mengajukan verifikasi." };

  if (mentor.status !== "approved") {
    const { error } = await supabase
      .from("mentor_profiles")
      .update({ status: "pending" as MentorStatus })
      .eq("id", mentor.id);
    if (error) return { ok: false, error: `Gagal mengajukan verifikasi: ${error.message}` };
  }
  revalidatePath("/mentor/dashboard");
  return { ok: true };
}

function toMin(t: string): number {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
}
