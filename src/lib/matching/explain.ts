import { getWeights, normalisedWeights } from "./weights";

export interface WeightItem {
  key: string;
  label: string;
  pct: number;
}

/** Human-readable weight table (percentages summing to 100) for the UI. */
export function weightBreakdown(): WeightItem[] {
  const w = normalisedWeights(getWeights());
  return [
    { key: "subject", label: "Kecocokan mata kuliah", pct: Math.round(w.subject * 100) },
    { key: "topic", label: "Kecocokan topik/materi", pct: Math.round(w.topic * 100) },
    { key: "availability", label: "Ketersediaan waktu", pct: Math.round(w.availability * 100) },
    { key: "budget", label: "Kesesuaian budget", pct: Math.round(w.budget * 100) },
    { key: "rating", label: "Rating mentor", pct: Math.round(w.rating * 100) },
    { key: "experience", label: "Pengalaman mentor", pct: Math.round(w.experience * 100) },
  ];
}
