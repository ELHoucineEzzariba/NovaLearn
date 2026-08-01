// NovaLearn – KI-Feedback nach einer Übungsantwort (Plan Abschnitt 5/6/7).

import { VerdictBadge } from "@/components/ui/VerdictBadge";
import type { AiVerdict } from "@/types/question";

export function AnswerFeedback({ verdict, feedback }: { verdict: AiVerdict; feedback: string }) {
  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3">
      <VerdictBadge verdict={verdict} />
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{feedback}</p>
    </div>
  );
}
