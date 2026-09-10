"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError } from "@/lib/utils";
import {
  completeSession,
  createBooking,
  startSession,
  updateBookingStatus,
  type CreateBookingInput,
} from "./booking.service";

// ---------------------------------------------------------------------------
// Server actions for the booking lifecycle (all real DB mutations).
// ---------------------------------------------------------------------------

export async function createBookingAction(
  input: Omit<CreateBookingInput, "studentId">
): Promise<{ ok: boolean; bookingId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan login terlebih dahulu." };

  try {
    const booking = await createBooking(supabase, { ...input, studentId: user.id });
    revalidatePath("/student/bookings");
    revalidatePath("/student/sessions");
    revalidatePath("/student/history");
    return { ok: true, bookingId: booking.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal membuat booking." };
  }
}

export async function acceptBookingAction(bookingId: string) {
  const supabase = await createClient();
  try {
    await updateBookingStatus(supabase, bookingId, "confirmed");
    revalidatePath("/mentor/dashboard");
    revalidatePath("/mentor/bookings");
    revalidatePath("/mentor/sessions");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menerima booking." };
  }
}

export async function rejectBookingAction(bookingId: string) {
  const supabase = await createClient();
  try {
    await updateBookingStatus(supabase, bookingId, "rejected");
    revalidatePath("/mentor/dashboard");
    revalidatePath("/mentor/bookings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menolak booking." };
  }
}

export async function cancelBookingAction(bookingId: string) {
  const supabase = await createClient();
  try {
    await updateBookingStatus(supabase, bookingId, "cancelled");
    revalidatePath("/student/bookings");
    revalidatePath("/student/sessions");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal membatalkan booking." };
  }
}

export async function startSessionAction(bookingId: string) {
  const supabase = await createClient();
  try {
    await startSession(supabase, bookingId);
    revalidatePath("/student/sessions");
    revalidatePath("/mentor/sessions");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memulai sesi." };
  }
}

export async function updateMeetingUrlAction(bookingId: string, url: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ meeting_url: url.trim() || null })
    .eq("booking_id", bookingId)
    .select("booking_id");
  if (error)
    return { ok: false, error: friendlyDbError(error, "Sesi tidak ditemukan.").message };
  revalidatePath("/mentor/sessions");
  revalidatePath("/student/sessions");
  return { ok: true };
}

export async function completeSessionAction(bookingId: string) {
  const supabase = await createClient();
  try {
    await completeSession(supabase, bookingId);
    revalidatePath("/student/sessions");
    revalidatePath("/student/history");
    revalidatePath("/student/dashboard");
    revalidatePath("/mentor/sessions");
    revalidatePath("/mentor/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyelesaikan sesi." };
  }
}
