// ---------------------------------------------------------------------------
// Mentora — shared domain types (mirrors the Supabase schema)
// ---------------------------------------------------------------------------

export type UserRole = "student" | "mentor" | "admin";
export type MentorStatus = "pending" | "approved" | "rejected";
export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type SessionStatus = "scheduled" | "in_progress" | "completed";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  major: string | null;
  semester: number | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  created_at: string;
}

export interface MentorProfile {
  id: string;
  user_id: string;
  status: MentorStatus;
  headline: string | null;
  bio: string | null;
  university: string | null;
  major: string | null;
  years_experience: number;
  price_per_session: number;
  meeting_url: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MentorAvailability {
  id: string;
  mentor_id: string;
  day_of_week: number; // 0 = Sunday ... 6 = Saturday
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  student_id: string;
  mentor_id: string;
  subject_id: string;
  topic: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string;
  duration_minutes: 30 | 60 | 90;
  price: number;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  booking_id: string;
  meeting_url: string | null;
  started_at: string | null;
  ended_at: string | null;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  mentor_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  payment_method: string | null;
  payment_status: PaymentStatus;
  transaction_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// --- Composite row shapes returned by the app services ----------------------

export interface MentorWithProfile extends MentorProfile {
  profile: Pick<Profile, "id" | "full_name" | "avatar_url" | "university" | "major" | "bio">;
}

export interface MentorListItem {
  mentor_id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  university: string | null;
  major: string | null;
  years_experience: number;
  price_per_session: number;
  status: MentorStatus;
  category_name: string | null;
  subjects: { id: string; name: string }[];
  availability: MentorAvailability[];
  avg_rating: number | null;
  review_count: number;
  completed_sessions: number;
  matching_score?: number;
  matched_subject?: boolean;
}

export interface BookingWithDetails extends Booking {
  mentor: MentorListItem | null;
  student: Profile | null;
  subject: Subject | null;
  session: Session | null;
  payment: Payment | null;
  review: Review | null;
}

export interface MatchCriteria {
  category_id: string | null;
  subject_id: string | null;
  topic: string;
  date: string | null;
  start_time: string | null; // HH:MM
  duration_minutes: 30 | 60 | 90;
  budget_min: number | null;
  budget_max: number | null;
}

export interface MatchResult {
  mentor: MentorListItem;
  score: number;
  breakdown: {
    subject: number;
    topic: number;
    availability: number;
    budget: number;
    rating: number;
    experience: number;
  };
  max: number;
}
