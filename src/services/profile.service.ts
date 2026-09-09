import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types";

// ---------------------------------------------------------------------------
// Profile service — user's own profile only (RLS enforces ownership).
// ---------------------------------------------------------------------------

export interface ProfileInput {
  full_name?: string;
  avatar_url?: string | null;
  university?: string | null;
  major?: string | null;
  semester?: number | null;
  bio?: string | null;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  input: ProfileInput
): Promise<Profile> {
  const patch: Record<string, unknown> = {};
  if (input.full_name !== undefined) patch.full_name = input.full_name.trim() || null;
  if (input.avatar_url !== undefined) patch.avatar_url = input.avatar_url;
  if (input.university !== undefined) patch.university = input.university?.trim() || null;
  if (input.major !== undefined) patch.major = input.major?.trim() || null;
  if (input.semester !== undefined) patch.semester = input.semester;
  if (input.bio !== undefined) patch.bio = input.bio?.trim() || null;

  if (Object.keys(patch).length === 0) throw new Error("Tidak ada data untuk disimpan.");

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw new Error(`Gagal memperbarui profil: ${error.message}`);
  return data as Profile;
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data as Profile | null;
}
