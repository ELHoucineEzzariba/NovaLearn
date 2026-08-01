"use client";

// NovaLearn – Themen-Karte fürs Dashboard (Plan Abschnitt 6/7): Titel,
// Relevanz-Badge, Fortschritts-Ampel, aufklappbare Begründung.

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { RelevanceBadge } from "@/components/ui/RelevanceBadge";
import { ProgressBadge } from "@/components/ui/ProgressBadge";
import type { Topic } from "@/types/topic";

const SIGNAL_LABEL: Record<string, string> = {
  wiederholung_material: "Wiederholt sich im Material",
  explizite_markierung: "Explizit als wichtig markiert",
  strukturelle_position: "Eigene Kapitelüberschrift / prominente Position",
};

export function TopicCard({ topic, courseId }: { topic: Topic; courseId: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-medium text-slate-900">{topic.title}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{topic.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RelevanceBadge score={topic.relevanceScore} />
          <ProgressBadge status={topic.progressStatus} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            strokeWidth={2.25}
          />
          Warum relevant?
        </button>
        <Link
          href={`/courses/${courseId}/topics/${topic.id}`}
          className="text-xs font-medium text-[#8A38EC] hover:underline"
        >
          Üben →
        </Link>
      </div>

      {expanded && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <p>{topic.relevanceReasoning}</p>
          {topic.relevanceSignals.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-slate-500">
              {topic.relevanceSignals.map((signal) => (
                <li key={signal}>{SIGNAL_LABEL[signal] ?? signal}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
