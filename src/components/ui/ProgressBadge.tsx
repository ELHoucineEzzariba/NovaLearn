// NovaLearn – Fortschritts-Ampel für TopicCard.tsx / Dashboard (Plan Abschnitt 5/6).

import { StatusPill } from "./StatusPill";
import { PROGRESS_ICON } from "@/lib/ui/icons";
import { PROGRESS_COLOR_TOKENS } from "@/lib/ui/colorTokens";
import type { ProgressStatus } from "@/types/topic";

const LABEL: Record<ProgressStatus, string> = {
  nicht_begonnen: "Nicht begonnen",
  unsicher: "Unsicher",
  verstanden: "Verstanden",
};

export function ProgressBadge({ status }: { status: ProgressStatus }) {
  return (
    <StatusPill
      icon={PROGRESS_ICON[status]}
      label={LABEL[status]}
      colorToken={PROGRESS_COLOR_TOKENS[status]}
    />
  );
}
