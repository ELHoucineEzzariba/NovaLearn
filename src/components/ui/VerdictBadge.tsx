// NovaLearn – KI-Bewertungs-Badge für AnswerFeedback.tsx (Plan Abschnitt 5/6).

import { StatusPill } from "./StatusPill";
import { VERDICT_ICON } from "@/lib/ui/icons";
import { VERDICT_COLOR_TOKENS } from "@/lib/ui/colorTokens";
import type { AiVerdict } from "@/types/question";

const LABEL: Record<AiVerdict, string> = {
  richtig: "Richtig",
  teilweise: "Teilweise richtig",
  falsch: "Nicht richtig",
};

export function VerdictBadge({ verdict }: { verdict: AiVerdict }) {
  return (
    <StatusPill
      icon={VERDICT_ICON[verdict]}
      label={LABEL[verdict]}
      colorToken={VERDICT_COLOR_TOKENS[verdict]}
    />
  );
}
