// ---------------------------------------------------------------------------
// Matching weights — fully configurable without touching algorithm code.
// Defaults follow the product spec:
//   Subject      30%   Topic 20%   Availability 20%   Budget 15%
//   Rating 10%   Experience 5%
// Weights are normalised at runtime so any combination summing to any value
// still yields a 0-100 score.
// ---------------------------------------------------------------------------

export interface MatchWeights {
  subject: number;
  topic: number;
  availability: number;
  budget: number;
  rating: number;
  experience: number;
}

export const DEFAULT_WEIGHTS: MatchWeights = {
  subject: 30,
  topic: 20,
  availability: 20,
  budget: 15,
  rating: 10,
  experience: 5,
};

export const WEIGHTS_KEY = "mentora_matching_weights";

export function getWeights(overrides?: Partial<MatchWeights>): MatchWeights {
  return { ...DEFAULT_WEIGHTS, ...(overrides ?? {}) };
}

export function normalisedWeights(w: MatchWeights): MatchWeights {
  const sum = w.subject + w.topic + w.availability + w.budget + w.rating + w.experience;
  if (sum <= 0) return getWeights();
  return {
    subject: w.subject / sum,
    topic: w.topic / sum,
    availability: w.availability / sum,
    budget: w.budget / sum,
    rating: w.rating / sum,
    experience: w.experience / sum,
  };
}
