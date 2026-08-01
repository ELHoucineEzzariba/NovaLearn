// NovaLearn – Icon-System (lucide-react), konsistent mit der bereits für
// NovaChat/NovaFlow getroffenen Entscheidung: Open Source, MIT-lizenziert,
// Named Imports für sauberes Tree-Shaking in Next.js. Fallback bei
// fehlendem Icon: Tabler Icons oder Heroicons (gleiche Lizenzlage).
//
// Hinweis zu den selteneren Namen (`Presentation`, `FileClock`,
// `SignalHigh/-Medium/-Low`): diese Datei konnte in dieser Sandbox nicht
// gegen ein echtes `npm install lucide-react` geprüft werden (Netzwerk hier
// gesperrt). Der Resolver unten fällt bei jedem unbekannten Namen sicher auf
// `HelpCircle` zurück statt zu crashen — nach dem ersten lokalen
// `npm run dev` kurz die Konsole auf entsprechende Warnungen prüfen, falls
// sich einer der Namen geändert haben sollte.

import {
  // Relevanz (Themenliste)
  SignalHigh,
  SignalMedium,
  SignalLow,
  // Fortschritts-Ampel
  Circle,
  CircleDashed,
  CheckCircle2,
  // Fragetypen
  BookOpen,
  Wrench,
  Shuffle,
  // KI-Bewertung
  CircleAlert,
  XCircle,
  // Quellen-Typen
  Presentation,
  FileText,
  PencilLine,
  FileClock,
  // Allgemeine UI
  UploadCloud,
  Plus,
  Send,
  MessageCircle,
  Quote,
  ChevronDown,
  Percent,
  Loader2,
  AlertTriangle,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

import type { RelevanceLevel } from "@/types/topic";
import type { ProgressStatus } from "@/types/topic";
import type { QuestionType, AiVerdict } from "@/types/question";
import type { SourceType } from "@/types/course";

const ALL_ICONS = {
  SignalHigh,
  SignalMedium,
  SignalLow,
  Circle,
  CircleDashed,
  CheckCircle2,
  BookOpen,
  Wrench,
  Shuffle,
  CircleAlert,
  XCircle,
  Presentation,
  FileText,
  PencilLine,
  FileClock,
  UploadCloud,
  Plus,
  Send,
  MessageCircle,
  Quote,
  ChevronDown,
  Percent,
  Loader2,
  AlertTriangle,
  HelpCircle,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ALL_ICONS;

export function resolveIcon(name: string): LucideIcon {
  const icon = (ALL_ICONS as Record<string, LucideIcon>)[name];
  if (!icon) {
    console.warn(`[NovaLearn] Unbekannter Icon-Name "${name}", falle auf HelpCircle zurück.`);
    return HelpCircle;
  }
  return icon;
}

// ---- Fachliche Zuordnungen (Plan Abschnitt 4–6) --------------------------

export const RELEVANCE_ICON: Record<RelevanceLevel, IconName> = {
  hoch: "SignalHigh",
  mittel: "SignalMedium",
  niedrig: "SignalLow",
};

export const PROGRESS_ICON: Record<ProgressStatus, IconName> = {
  nicht_begonnen: "Circle",
  unsicher: "CircleDashed",
  verstanden: "CheckCircle2",
};

export const QUESTION_TYPE_ICON: Record<QuestionType, IconName> = {
  definition: "BookOpen",
  anwendung: "Wrench",
  transfer: "Shuffle",
};

export const VERDICT_ICON: Record<AiVerdict, IconName> = {
  richtig: "CheckCircle2",
  teilweise: "CircleAlert",
  falsch: "XCircle",
};

export const SOURCE_TYPE_ICON: Record<SourceType, IconName> = {
  folie: "Presentation",
  skript: "FileText",
  uebung: "PencilLine",
  altklausur: "FileClock",
};

// Allgemeine UI-Icons (Upload-Flow, Chat, Kursliste, aufklappbare Begründung, ...)
export const UI_ICON = {
  uploadZone: "UploadCloud",
  newCourse: "Plus",
  chatSend: "Send",
  chatBubble: "MessageCircle",
  sourceCitation: "Quote",
  expandReasoning: "ChevronDown",
  overallProgress: "Percent",
  processing: "Loader2", // mit CSS animate-spin verwenden
  extractionError: "AlertTriangle",
} as const satisfies Record<string, IconName>;
