"use server";

import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Storage service — avatar uploads into Supabase Storage bucket "avatars".
// Requires the bucket to exist (see README "Setup Supabase").
// Files are stored under {userId}/avatar.png and made publicly readable so
// plain <img> tags work everywhere without signed URL plumbing.
// ---------------------------------------------------------------------------

const BUCKET = "avatars";

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  if (!file || file.size === 0) throw new Error("Pilih file terlebih dahulu.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Ukuran file maksimal 2 MB.");
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw new Error(`Gagal mengunggah foto: ${uploadError.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
