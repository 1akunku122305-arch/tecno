import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MentorAvailability,
  MentorListItem,
  MentorProfile,
  MentorWithProfile,
  Review,
  Subject,
  Topic,
} from "@/types";

// ---------------------------------------------------------------------------
// Mentor service — fetches mentors with ratings/completed session counts
// computed from the database (never hardcoded).
// ---------------------------------------------------------------------------

export interface MentorFilters {
  categoryId?: string;
  subjectId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  page?: number;
  pageSize?: number;
}

export interface MentorPage {
  mentors: MentorListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Shared embedded select so all mentor list-item queries stay in sync. */
const MENTOR_LIST_SELECT =
  "id, user_id, headline, bio, university, major, years_experience, price_per_session, status, category_id, profile:profiles!mentor_profiles_user_id_fkey(full_name, avatar_url)";

/** Raw shape returned by PostgREST for the mentor_profiles query. */
type MentorRow = {
  id: string;
  user_id: string;
  headline: string | null;
  bio: string | null;
  university: string | null;
  major: string | null;
  years_experience: number;
  price_per_session: number;
  status: "pending" | "approved" | "rejected";
  category_id: string | null;
  profile: { full_name: string | null; avatar_url: string | null } | null;
};

export async function getMentorPage(
  supabase: SupabaseClient,
  filters: MentorFilters = {}
): Promise<MentorPage> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 12));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("mentor_profiles")
    .select(MENTOR_LIST_SELECT, { count: "exact" })
    .eq("status", "approved");

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.minPrice !== undefined && filters.minPrice !== null)
    query = query.gte("price_per_session", filters.minPrice);
  if (filters.maxPrice !== undefined && filters.maxPrice !== null)
    query = query.lte("price_per_session", filters.maxPrice);
  if (filters.search) {
    // Sanitise characters that would break the PostgREST `or=(...)` syntax.
    const term = `%${filters.search.trim().replace(/[%(),."]/g, " ").replace(/\s+/g, " ")}%`;
    query = query.or(
      ["headline", "bio", "university"].map((c) => `${c}.ilike.${term}`).join(",")
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Gagal memuat mentor: ${error.message}`);

  const mentors = await hydrateMentors(supabase, (data ?? []) as unknown as MentorRow[]);

  let filtered = mentors;
  const subjectId = filters.subjectId;
  if (subjectId) {
    filtered = filtered.filter((m) => m.subjects.some((s) => s.id === subjectId));
  }
  const minRating = filters.minRating;
  if (minRating !== undefined && minRating !== null) {
    filtered = filtered.filter((m) => (m.avg_rating ?? 0) >= minRating);
  }

  const total = count ?? filtered.length;
  return {
    mentors: filtered,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Fetch + hydrate many mentors with subjects, availability and live stats. */
async function hydrateMentors(
  supabase: SupabaseClient,
  rows: MentorRow[]
): Promise<MentorListItem[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const catIds = rows.map((r) => r.category_id).filter(Boolean) as string[];

  const [subjectsRes, availRes, reviewsRes, countsRes, catsRes] = await Promise.all([
    supabase
      .from("mentor_subjects")
      .select("mentor_id, subject_id, subject:subjects(id, name)")
      .in("mentor_id", ids),
    supabase
      .from("mentor_availability")
      .select("*")
      .in("mentor_id", ids)
      .eq("is_available", true)
      .order("day_of_week"),
    supabase.from("reviews").select("mentor_id, rating").in("mentor_id", ids),
    supabase
      .from("bookings")
      .select("mentor_id, status")
      .in("mentor_id", ids)
      .eq("status", "completed"),
    catIds.length > 0
      ? supabase.from("categories").select("id, name").in("id", catIds)
      : supabase.from("categories").select("id, name").limit(0),
  ]);

  const subsByMentor = new Map<string, { id: string; name: string }[]>();
  for (const row of (subjectsRes.data ?? []) as unknown as {
    mentor_id: string;
    subject: { id: string; name: string } | { id: string; name: string }[];
  }[]) {
    const s = Array.isArray(row.subject) ? row.subject[0] : row.subject;
    if (!s) continue;
    const arr = subsByMentor.get(row.mentor_id) ?? [];
    arr.push(s);
    subsByMentor.set(row.mentor_id, arr);
  }

  const availByMentor = new Map<string, MentorAvailability[]>();
  for (const row of (availRes.data ?? []) as unknown as MentorAvailability[]) {
    const arr = availByMentor.get(row.mentor_id) ?? [];
    arr.push(row);
    availByMentor.set(row.mentor_id, arr);
  }

  const ratingAgg = new Map<string, { sum: number; count: number }>();
  for (const row of (reviewsRes.data ?? []) as unknown as { mentor_id: string; rating: number }[]) {
    const agg = ratingAgg.get(row.mentor_id) ?? { sum: 0, count: 0 };
    agg.sum += row.rating;
    agg.count += 1;
    ratingAgg.set(row.mentor_id, agg);
  }

  const completedByMentor = new Map<string, number>();
  for (const row of (countsRes.data ?? []) as unknown as { mentor_id: string }[]) {
    completedByMentor.set(row.mentor_id, (completedByMentor.get(row.mentor_id) ?? 0) + 1);
  }

  const catName = new Map<string, string>();
  for (const c of (catsRes.data ?? []) as unknown as { id: string; name: string }[])
    catName.set(c.id, c.name);

  return rows.map((row) => {
    const agg = ratingAgg.get(row.id);
    return {
      mentor_id: row.id,
      user_id: row.user_id,
      full_name: row.profile?.full_name ?? null,
      avatar_url: row.profile?.avatar_url ?? null,
      headline: row.headline,
      bio: row.bio,
      university: row.university ?? null,
      major: row.major ?? null,
      years_experience: row.years_experience,
      price_per_session: row.price_per_session,
      status: row.status,
      category_name: row.category_id ? (catName.get(row.category_id) ?? null) : null,
      subjects: subsByMentor.get(row.id) ?? [],
      availability: availByMentor.get(row.id) ?? [],
      avg_rating: agg && agg.count > 0 ? Number((agg.sum / agg.count).toFixed(1)) : null,
      review_count: agg?.count ?? 0,
      completed_sessions: completedByMentor.get(row.id) ?? 0,
    };
  });
}

export async function getMentorListItem(
  supabase: SupabaseClient,
  mentorId: string
): Promise<MentorListItem | null> {
  const { data } = await supabase
    .from("mentor_profiles")
    .select(MENTOR_LIST_SELECT)
    .eq("id", mentorId)
    .maybeSingle();

  if (!data) return null;
  const [hydrated] = await hydrateMentors(supabase, [data as unknown as MentorRow]);
  return hydrated ?? null;
}

/**
 * Batch fetch + hydrate mentors by id (single round-trip + shared hydration
 * queries). Used by booking dashboards to avoid N+1 per-booking lookups.
 */
export async function getMentorListItemsByIds(
  supabase: SupabaseClient,
  mentorIds: string[]
): Promise<MentorListItem[]> {
  const ids = [...new Set(mentorIds)];
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("mentor_profiles")
    .select(MENTOR_LIST_SELECT)
    .in("id", ids);
  if (error) throw new Error(`Gagal memuat mentor: ${error.message}`);
  return hydrateMentors(supabase, (data ?? []) as unknown as MentorRow[]);
}

export type MentorDetailReview = Review & {
  reviewer: { full_name: string | null; avatar_url: string | null } | null;
};

export async function getMentorDetail(
  supabase: SupabaseClient,
  mentorId: string
): Promise<{
  mentor: MentorListItem | null;
  topics: Topic[];
  reviews: MentorDetailReview[];
}> {
  const mentor = await getMentorListItem(supabase, mentorId);
  if (!mentor) return { mentor: null, topics: [], reviews: [] };

  const [topicsRes, reviewsRes] = await Promise.all([
    supabase
      .from("mentor_topics")
      .select("topic:topics(id, subject_id, name, created_at)")
      .eq("mentor_id", mentorId),
    supabase
      .from("reviews")
      .select("*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)")
      .eq("mentor_id", mentorId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const topics: Topic[] = [];
  for (const row of (topicsRes.data ?? []) as unknown as {
    topic: Topic | Topic[];
  }[]) {
    const t = Array.isArray(row.topic) ? row.topic[0] : row.topic;
    if (t) topics.push(t);
  }

  return {
    mentor,
    topics,
    reviews: (reviewsRes.data ?? []) as unknown as MentorDetailReview[],
  };
}

export async function getMentorSubjects(
  supabase: SupabaseClient,
  mentorId: string
): Promise<Subject[]> {
  const { data } = await supabase
    .from("mentor_subjects")
    .select("subject:subjects(*)")
    .eq("mentor_id", mentorId);
  const subjects: Subject[] = [];
  for (const row of (data ?? []) as unknown as { subject: Subject | Subject[] }[]) {
    const s = Array.isArray(row.subject) ? row.subject[0] : row.subject;
    if (s) subjects.push(s);
  }
  return subjects;
}

export async function getMentorProfileForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<MentorProfile | null> {
  const { data } = await supabase
    .from("mentor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data as MentorProfile | null;
}

export async function getAvailability(
  supabase: SupabaseClient,
  mentorId: string
): Promise<MentorAvailability[]> {
  const { data } = await supabase
    .from("mentor_availability")
    .select("*")
    .eq("mentor_id", mentorId)
    .eq("is_available", true)
    .order("day_of_week")
    .order("start_time");
  return (data ?? []) as MentorAvailability[];
}

type MentorJoinedProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  major: string | null;
  bio: string | null;
  role: string;
};

export async function getMentorWithProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<MentorWithProfile | null> {
  const { data } = await supabase
    .from("mentor_profiles")
    .select("*, profile:profiles!mentor_profiles_user_id_fkey(*)")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as MentorProfile & { profile: MentorJoinedProfile };
  return { ...row, profile: row.profile };
}

export async function getMentorById(supabase: SupabaseClient, mentorId: string) {
  const { data } = await supabase
    .from("mentor_profiles")
    .select("*")
    .eq("id", mentorId)
    .maybeSingle();
  return data as MentorProfile | null;
}
