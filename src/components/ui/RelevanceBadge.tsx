// NovaLearn – Relevanz-Badge für TopicCard.tsx (Plan Abschnitt 6/7).
// Nimmt wahlweise den rohen relevanceScore (0–100) oder direkt die Stufe.

import { StatusPill } from "./StatusPill";
import { RELEVANCE_ICON } from "@/lib/ui/icons";
import { RELEVANCE_COLOR_TOKENS } from "@/lib/ui/colorTokens";
import { relevanceLevelFromScore, type RelevanceLevel } from "@/types/topic";

const LABEL: Record<RelevanceLevel, string> = {
  hoch: "Hohe Relevanz",
  mittel: "Mittlere Relevanz",
  niedrig: "Niedrige Relevanz",
};

type RelevanceBadgeProps = { score: number } | { level: RelevanceLevel };

export function RelevanceBadge(props: RelevanceBadgeProps) {
  const level = "level" in props ? props.level : relevanceLevelFromScore(props.score);
  return (
    <StatusPill
      icon={RELEVANCE_ICON[level]}
      label={LABEL[level]}
      colorToken={RELEVANCE_COLOR_TOKENS[level]}
    />
  );
}
