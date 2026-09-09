import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, BookingStatus, BookingWithDetails, Session } from "@/types";

// ---------------------------------------------------------------------------
// Booking service — create/read/update bookings + advance sessions.
// Double-booking and price integrity are additionally enforced at the
// database layer (trigger + RLS), so client bugs cannot corrupt data.
// ---------------------------------------------------------------------------

export interface CreateBookingInput {
  studentId: string;
  mentorId: string;
  subjectId: string;
  topic: string;
  date: string;
  startTime: string; // HH:MM
  durationMinutes: 30 | 60 | 90;
  price: number;
  notes?: string | null;
}

export async function createBooking(
  supabase: SupabaseClient,
  input: CreateBookingInput
): Promise<Booking> {
  // Server-side validation (mirrors RLS + triggers)
  const topic = input.topic.trim();
  if (!input.subjectId) throw new Error("Mata kuliah wajib dipilih.");
  if (topic.length < 3) throw new Error("Topik/materi minimal 3 karakter.");
  if (input.durationMinutes !== 30 && input.durationMinutes !== 60 && input.durationMinutes !== 90)
    throw new Error("Durasi harus 30, 60, atau 90 menit.");

  const start = toMinutes(input.startTime);
  const end = start + input.durationMinutes;
  if (end > 24 * 60) throw new Error("Waktu sesi melewati batas hari (23:59).");

  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("status, price_per_session, id")
    .eq("id", input.mentorId)
    .maybeSingle();

  if (!mentor) throw new Error("Mentor tidak ditemukan.");
  if (mentor.status !== "approved") throw new Error("Mentor belum terverifikasi.");
  if (mentor.price_per_session !== input.price)
    throw new Error("Harga tidak sesuai dengan harga mentor.");

  const date = new Date(`${input.date}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Tanggal tidak valid.");
  if (date.getTime() < Date.now() - 24 * 60 * 60 * 1000)
    throw new Error("Tanggal sesi tidak boleh di masa lalu.");

  // Availability check against weekly slots
  const dayOfWeek = date.getDay();
  const { data: slots } = await supabase
    .from("mentor_availability")
    .select("*")
    .eq("mentor_id", input.mentorId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_available", true);

  const slotOk = (slots ?? []).some((s) => {
    const sStart = toMinutes(s.start_time);
    const sEnd = toMinutes(s.end_time);
    return sStart <= start && end <= sEnd;
  });
  if (!slotOk) throw new Error("Mentor tidak tersedia pada waktu tersebut.");

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      student_id: input.studentId,
      mentor_id: input.mentorId,
      subject_id: input.subjectId,
      topic,
      date: input.date,
      start_time: `${input.startTime}:00`,
      end_time: `${fmtMinutes(end)}:00`,
      duration_minutes: input.durationMinutes,
      price: input.price,
      notes: input.notes?.trim() || null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    // Surface friendly DB trigger messages
    if (error.message.includes("Slot sudah dipakai")) {
      throw new Error("Slot tersebut sudah dibooking oleh mahasiswa lain.");
    }
    if (error.code === "42501") {
      throw new Error(
        "Booking ditolak: mentor belum terverifikasi atau data tidak valid."
      );
    }
    throw new Error(`Gagal membuat booking: ${error.message}`);
  }
  return data as Booking;
}

export async function updateBookingStatus(
  supabase: SupabaseClient,
  bookingId: string,
  status: BookingStatus
): Promise<Booking> {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .select("*")
    .single();
  if (error) throw new Error(`Gagal memperbarui booking: ${error.message}`);
  return data as Booking;
}

export async function getBooking(
  supabase: SupabaseClient,
  bookingId: string
): Promise<BookingWithDetails | null> {
  const { data } = await supabase
    .from("bookings")
    .select("*, session:sessions(*), payment:payments(*), review:reviews(*), subject:subjects(*)")
    .eq("id", bookingId)
    .maybeSingle();
  if (!data) return null;
  return hydrateBooking(supabase, data as BookingRow);
}

/** Bookings for a user's dashboard (student or mentor, resolved by role). */
export async function getBookingsForDashboard(
  supabase: SupabaseClient,
  userId: string,
  role: "student" | "mentor",
  statusFilter?: BookingStatus[]
): Promise<BookingWithDetails[]> {
  let query = supabase
    .from("bookings")
    .select("*, session:sessions(*), payment:payments(*), review:reviews(*), subject:subjects(*)");

  if (role === "student") {
    query = query.eq("student_id", userId);
  } else {
    const { data: mentor } = await supabase
      .from("mentor_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!mentor) return [];
    query = query.eq("mentor_id", mentor.id);
  }
  if (statusFilter && statusFilter.length > 0) query = query.in("status", statusFilter);

  const { data, error } = await query.order("date", { ascending: false }).order("start_time", { ascending: false }).limit(100);
  if (error) throw new Error(`Gagal memuat booking: ${error.message}`);

  const bookings = (data ?? []) as unknown as BookingRow[];
  return Promise.all(bookings.map((b) => hydrateBooking(supabase, b)));
}

type BookingRow = Booking & {
  session: Session | null;
  payment: unknown;
  review: unknown;
  subject: { id: string; name: string } | null;
};

async function hydrateBooking(
  supabase: SupabaseClient,
  row: BookingRow
): Promise<BookingWithDetails> {
  const mentor = await getMentorForBooking(supabase, row.mentor_id);
  const student = row.student_id ? await getStudentForBooking(supabase, row.student_id) : null;
  return {
    ...row,
    mentor,
    student,
    subject: row.subject as BookingWithDetails["subject"],
    session: row.session as BookingWithDetails["session"],
    payment: row.payment as BookingWithDetails["payment"],
    review: row.review as BookingWithDetails["review"],
  };
}

async function getMentorForBooking(
  supabase: SupabaseClient,
  mentorId: string
): Promise<BookingWithDetails["mentor"] | null> {
  const { getMentorListItem } = await import("./mentor.service");
  return getMentorListItem(supabase, mentorId);
}

async function getStudentForBooking(
  supabase: SupabaseClient,
  studentId: string
): Promise<BookingWithDetails["student"] | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, university, major, semester, bio, created_at, updated_at")
    .eq("id", studentId)
    .maybeSingle();
  return (data as BookingWithDetails["student"]) ?? null;
}

// --- Session helpers --------------------------------------------------------

export async function getSessionForBooking(
  supabase: SupabaseClient,
  bookingId: string
): Promise<Session | null> {
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();
  return data as Session | null;
}

export async function startSession(
  supabase: SupabaseClient,
  bookingId: string
): Promise<Session> {
  const { data, error } = await supabase
    .from("sessions")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .select("*")
    .single();
  if (error) throw new Error(`Gagal memulai sesi: ${error.message}`);
  return data as Session;
}

export async function completeSession(
  supabase: SupabaseClient,
  bookingId: string
): Promise<Session> {
  const { data, error } = await supabase
    .from("sessions")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .select("*")
    .single();
  if (error) throw new Error(`Gagal menyelesaikan sesi: ${error.message}`);
  return data as Session;
}

function toMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}

function fmtMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
