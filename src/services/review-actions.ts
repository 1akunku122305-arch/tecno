"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createReview } from "./review.service";

export async function createReviewAction(input: {
  bookingId: string;
  mentorId: string;
  rating: number;
  review?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan login." };

  try {
    await createReview(supabase, { ...input, reviewerId: user.id });
    revalidatePath("/student/history");
    revalidatePath("/student/dashboard");
    revalidatePath("/mentor/reviews");
    revalidatePath("/mentor/dashboard");
    revalidatePath(`/mentors/${input.mentorId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan review." };
  }
}

export async function markNotificationsReadAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id);
  revalidatePath("/student/notifications");
  revalidatePath("/mentor/notifications");
}
