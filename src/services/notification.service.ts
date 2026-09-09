import type { SupabaseClient } from "@supabase/supabase-js";
import type { Notification } from "@/types";

// ---------------------------------------------------------------------------
// Notification service.
// Event-driven notifications are created by database triggers
// (see supabase/migrations). This service is only for READING and marking
// notifications as read — the app never fabricates static notifications.
// ---------------------------------------------------------------------------

export async function getNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit = 20
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Gagal memuat notifikasi: ${error.message}`);
  return (data ?? []) as Notification[];
}

export async function getUnreadCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) return 0;
  return count ?? 0;
}

export async function markAllRead(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
}

export async function markOneRead(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string
): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);
}
