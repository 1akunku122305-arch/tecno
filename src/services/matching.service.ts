import type { SupabaseClient } from "@supabase/supabase-js";
import type { MatchCriteria, MatchResult } from "@/types";
import { computeScore, rankMatches } from "@/lib/matching/scoring";
import { getMentorPage } from "./mentor.service";

// ---------------------------------------------------------------------------
// Matching orchestrator.
// 1. Applies cheap database-side filters (category, price, subject join).
// 2. Hydrates mentor context.
// 3. Scores each candidate with the transparent weighted algorithm.
// ---------------------------------------------------------------------------

export interface FindMatchesOptions {
  limit?: number;
  page?: number;
}

export async function findMentorMatches(
  supabase: SupabaseClient,
  criteria: MatchCriteria,
  options: FindMatchesOptions = {}
): Promise<{ matches: MatchResult[]; total: number }> {
  const page = options.page ?? 1;

  // NOTE: budget is intentionally NOT pre-filtered in the database here —
  // out-of-budget mentors are still scored (linear falloff in budgetScore)
  // so the budget dimension actually differentiates results.
  const { mentors, total } = await getMentorPage(supabase, {
    categoryId: criteria.category_id ?? undefined,
    page,
    pageSize: 48,
  });

  const results: MatchResult[] = mentors.map((mentor) =>
    computeScore({
      mentor: { ...mentor, matched_subject: undefined },
      criteria,
    })
  );

  // Only surface results with meaningful relevance unless the user gave no
  // subject at all (then show best-rated generalists).
  let ranked = rankMatches(results);
  if (criteria.subject_id) {
    ranked = ranked.filter((r) => r.breakdown.subject === 100 || r.score >= 40);
  }
  const limit = options.limit ?? 24;
  ranked = ranked.slice(0, limit);

  return { matches: ranked, total: ranked.length === 0 ? 0 : total };
}
