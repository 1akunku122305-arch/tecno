import type { SupabaseClient } from "@supabase/supabase-js";
import type { Review } from "@/types";

// ---------------------------------------------------------------------------
// Review service. Ratings are ONLY created for completed bookings, one per
// booking (enforced by DB unique constraint + RLS). Mentor average rating is
// always computed from reviews — never hardcoded.
// ---------------------------------------------------------------------------

export async function createReview(
  supabase: SupabaseClient,
  input: {
    bookingId: string;
    reviewerId: string;
    mentorId: string;
    rating: number;
    review?: string;
  }
): Promise<Review> {
  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) throw new Error("Rating harus antara 1 dan 5.");

  // Double-check booking is completed (RLS also enforces this).
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, student_id")
    .eq("id", input.bookingId)
    .maybeSingle();

  if (!booking || booking.status !== "completed")
    throw new Error("Rating hanya dapat diberikan untuk sesi yang sudah selesai.");
  if (booking.student_id !== input.reviewerId)
    throw new Error("Hanya mahasiswa pemilik booking yang dapat memberi rating.");

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      booking_id: input.bookingId,
      reviewer_id: input.reviewerId,
      mentor_id: input.mentorId,
      rating,
      review: input.review?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505" || error.message.includes("duplicate"))
      throw new Error("Anda sudah memberikan review untuk booking ini.");
    throw new Error(`Gagal menyimpan review: ${error.message}`);
  }
  return data as Review;
}

export async function getReviewForBooking(
  supabase: SupabaseClient,
  bookingId: string
): Promise<Review | null> {
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();
  return data as Review | null;
}
