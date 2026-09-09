import type { MatchCriteria, MentorListItem, MatchResult } from "@/types";
import { getWeights, normalisedWeights, type MatchWeights } from "./weights";

// ---------------------------------------------------------------------------
// Transparent matching score.
//
// Every component returns a 0..1 score derived from REAL data:
//   * Subject       - exact subject match (1) — academic relevance dominates;
//                     irrelevant mentors cannot score high.
//   * Topic         - token overlap between student's topic text and the
//                     mentor's topic names + subject name + headline/bio.
//   * Availability  - weekly slot overlap with requested date/time.
//   * Budget        - mentor price inside [min,max] => 1; else linear falloff.
//   * Rating        - avg rating / 5 (0 if no reviews).
//   * Experience    - years_experience mapped with diminishing returns.
//
// No randomness. Pure, deterministic, unit-testable.
// ---------------------------------------------------------------------------

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Token-based textual overlap, used for topic relevance. */
export function tokenOverlap(query: string, corpus: string[]): number {
  const q = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  if (q.length === 0) return 0;
  let hits = 0;
  for (const token of q) {
    if (corpus.some((c) => c.toLowerCase().includes(token))) hits += 1;
  }
  return hits / q.length;
}

export function subjectScore(mentor: MentorListItem, criteria: MatchCriteria): number {
  if (!criteria.subject_id) return 0.5; // neutral when not specified
  if (mentor.subjects.some((s) => s.id === criteria.subject_id)) return 1;
  return 0; // subject mismatch is penalised hard
}

export function topicScore(mentor: MentorListItem, criteria: MatchCriteria): number {
  if (!criteria.topic?.trim()) return 0.5; // neutral when not specified
  const corpus = [
    ...mentor.subjects.map((s) => s.name),
    mentor.headline ?? "",
    mentor.bio ?? "",
    mentor.major ?? "",
    mentor.category_name ?? "",
  ];
  return tokenOverlap(criteria.topic, corpus);
}

export function availabilityScore(mentor: MentorListItem, criteria: MatchCriteria): number {
  if (!criteria.date || !criteria.start_time) return 0.5; // neutral
  const dayOfWeek = new Date(`${criteria.date}T00:00:00`).getDay();
  const startMin = minutesOf(criteria.start_time);
  const endMin = startMin + criteria.duration_minutes;

  const overlappingSlots = mentor.availability.filter((a) => {
    if (a.day_of_week !== dayOfWeek || !a.is_available) return false;
    const aStart = minutesOf(a.start_time);
    const aEnd = minutesOf(a.end_time);
    return aStart <= startMin && endMin <= aEnd;
  });
  return overlappingSlots.length > 0 ? 1 : 0;
}

export function budgetScore(mentor: MentorListItem, criteria: MatchCriteria): number {
  const price = mentor.price_per_session;
  const hasMin = criteria.budget_min !== null && criteria.budget_min !== undefined;
  const hasMax = criteria.budget_max !== null && criteria.budget_max !== undefined;
  if (!hasMin && !hasMax) return 0.5; // neutral
  if (hasMax && price <= (criteria.budget_max ?? Infinity)) return 1;
  if (hasMin && !hasMax && price >= (criteria.budget_min ?? 0)) return 1;

  const min = criteria.budget_min ?? 0;
  const max = criteria.budget_max ?? 0;
  const range = Math.max(1, max - min);
  const dist = price < min ? min - price : hasMax ? price - max : 0;
  return clamp01(1 - dist / (range * 2));
}

export function ratingScore(mentor: MentorListItem): number {
  if (!mentor.avg_rating) return 0; // no fake baseline
  return clamp01(mentor.avg_rating / 5);
}

export function experienceScore(mentor: MentorListItem): number {
  const years = Math.max(0, mentor.years_experience);
  return clamp01(1 - Math.exp(-years / 4));
}

export interface ScoreInput {
  mentor: MentorListItem;
  criteria: MatchCriteria;
  weights?: Partial<MatchWeights>;
}

/**
 * Compute a 0..100 matching score with a transparent per-component breakdown.
 * If the subject does not match, the score is hard-capped below 50 so
 * academic relevance always dominates.
 */
export function computeScore(input: ScoreInput): MatchResult {
  const weights = normalisedWeights(getWeights(input.weights));

  const subject = subjectScore(input.mentor, input.criteria);
  const topic = topicScore(input.mentor, input.criteria);
  const availability = availabilityScore(input.mentor, input.criteria);
  const budget = budgetScore(input.mentor, input.criteria);
  const rating = ratingScore(input.mentor);
  const experience = experienceScore(input.mentor);

  const raw =
    subject * weights.subject +
    topic * weights.topic +
    availability * weights.availability +
    budget * weights.budget +
    rating * weights.rating +
    experience * weights.experience;

  const hasActualSubjectMatch =
    (weights.subject > 0 && subject >= 1) ||
    (weights.subject === 0 && topic > 0.5);
  const capped = hasActualSubjectMatch ? raw : Math.min(raw, 0.45);

  return {
    mentor: input.mentor,
    score: Math.round(capped * 100),
    breakdown: {
      subject: Math.round(subject * 100),
      topic: Math.round(topic * 100),
      availability: Math.round(availability * 100),
      budget: Math.round(budget * 100),
      rating: Math.round(rating * 100),
      experience: Math.round(experience * 100),
    },
    max: 100,
  };
}

/** Sort matches by score descending (stable, price tie-break). */
export function rankMatches(results: MatchResult[]): MatchResult[] {
  return [...results].sort(
    (a, b) => b.score - a.score || a.mentor.price_per_session - b.mentor.price_per_session
  );
}

function minutesOf(time: string): number {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}
