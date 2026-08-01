// NovaLearn – Kern-Typen für Themen & Fortschritt.
// 1:1 aus dem Build-Plan, Abschnitt 4.

export type RelevanceLevel = "hoch" | "mittel" | "niedrig";

export type ProgressStatus = "nicht_begonnen" | "unsicher" | "verstanden";

export type Topic = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  relevanceScore: number; // 0–100
  relevanceReasoning: string;
  relevanceSignals: string[]; // z.B. ["wiederholung_material", "explizite_markierung", "strukturelle_position"]
  chunkIds: string[];
  progressStatus: ProgressStatus;
  progressUpdatedAt: number;
};

/**
 * Leitet die UI-Relevanzstufe (hoch/mittel/niedrig) aus dem numerischen
 * relevanceScore (0–100) ab. Schwellenwerte bewusst hier zentralisiert statt
 * an mehreren UI-Stellen dupliziert.
 */
export function relevanceLevelFromScore(score: number): RelevanceLevel {
  if (score >= 70) return "hoch";
  if (score >= 40) return "mittel";
  return "niedrig";
}
