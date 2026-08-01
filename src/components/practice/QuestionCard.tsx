"use client";

// NovaLearn – Übungsfrage mit Freitext-Antwortfeld (Plan Abschnitt 7).

import { createElement, useState } from "react";
import { Loader2 } from "lucide-react";
import { resolveIcon } from "@/lib/ui/icons";
import { QUESTION_TYPE_ICON } from "@/lib/ui/icons";
import { AnswerFeedback } from "./AnswerFeedback";
import type { Question, AiVerdict } from "@/types/question";

const TYPE_LABEL: Record<Question["questionType"], string> = {
  definition: "Definition",
  anwendung: "Anwendung",
  transfer: "Transfer",
};

export function QuestionCard({
  question,
  onSubmitAnswer,
}: {
  question: Question;
  onSubmitAnswer: (answer: string) => Promise<{ verdict: AiVerdict; feedback: string }>;
}) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ verdict: AiVerdict; feedback: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await onSubmitAnswer(answer.trim());
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bewertung fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
        {createElement(resolveIcon(QUESTION_TYPE_ICON[question.questionType]), {
          className: "h-3.5 w-3.5",
          strokeWidth: 2.25,
        })}
        {TYPE_LABEL[question.questionType]}
      </div>
      <p className="mt-1.5 font-medium text-slate-900">{question.questionText}</p>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={result !== null}
        rows={3}
        placeholder="Deine Antwort…"
        className="mt-3 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
      />

      {result === null && (
        <button
          onClick={handleSubmit}
          disabled={submitting || !answer.trim()}
          className="brand-gradient-bg mt-2 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Antwort abschicken
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {result && <AnswerFeedback verdict={result.verdict} feedback={result.feedback} />}
    </div>
  );
}
