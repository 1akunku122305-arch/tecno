"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateProfile, type ProfileInput } from "./profile.service";
import { uploadAvatar } from "./storage.service";

export async function updateProfileAction(
  input: ProfileInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan login." };

  if (input.semester !== undefined && input.semester !== null) {
    if (input.semester < 1 || input.semester > 20)
      return { ok: false, error: "Semester harus antara 1 dan 20." };
  }

  try {
    await updateProfile(supabase, user.id, input);
    revalidatePath("/student/profile");
    revalidatePath("/mentor/profile");
    revalidatePath("/student/dashboard");
    revalidatePath("/mentor/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memperbarui profil." };
  }
}

export async function uploadAvatarAction(
  file: File,
  previousAvatarUrl?: string | null
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan login." };

  try {
    const url = await uploadAvatar(file, user.id);
    await updateProfile(supabase, user.id, { avatar_url: url });

    // Best-effort: remove the previous avatar object (in the same bucket &
    // the user's own folder) so the bucket doesn't accumulate old uploads.
    // Supabase public URL format: .../storage/v1/object/public/avatars/<userId>/<file>
    if (previousAvatarUrl) {
      const marker = `/avatars/${user.id}/`;
      const idx = previousAvatarUrl.indexOf(marker);
      if (idx !== -1) {
        const filename = previousAvatarUrl.slice(idx + marker.length).split("?")[0];
        // Guard: filename should be a single file name without path traversal
        if (filename && !filename.includes("/") && !filename.includes("..")) {
          const fullOldPath = `${user.id}/${filename}`;
          await supabase.storage.from("avatars").remove([fullOldPath]);
        }
      }
    }

    revalidatePath("/student/profile");
    revalidatePath("/mentor/profile");
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal mengunggah foto." };
  }
}
