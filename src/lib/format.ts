import type { Category, MentorListItem, Subject } from "@/types";

/**
 * Small formatters used across UI components. Kept framework-agnostic so they
 * can be reused in client components without touching server code.
 */

export function mentorRating(mentor: Pick<MentorListItem, "avg_rating" | "review_count">): {
  value: number | null;
  label: string;
} {
  const value = mentor.avg_rating ?? null;
  const label = value !== null ? `${value.toFixed(1)} (${mentor.review_count} ulasan)` : "Belum ada rating";
  return { value, label };
}

export function categoriesOptions(categories: Category[]) {
  return categories.map((c) => ({ value: c.id, label: c.name }));
}

export function subjectsOptions(subjects: Subject[]) {
  return subjects.map((s) => ({ value: s.id, label: s.name }));
}
