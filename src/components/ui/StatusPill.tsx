// NovaLearn – generischer "Icon + Label"-Pill-Baustein.
//
// Eine Komponente statt drei Kopien, weil Relevanz-Badge (TopicCard),
// Fortschritts-Ampel (TopicCard/Dashboard) und KI-Bewertung (AnswerFeedback)
// alle exakt dasselbe visuelle Muster brauchen: Icon + farbiger Hintergrund
// + Label (siehe Plan Abschnitt 6/7).

import { createElement } from "react";
import { resolveIcon, type IconName } from "@/lib/ui/icons";

type StatusPillProps = {
  icon: IconName;
  label: string;
  colorToken: { fg: string; bg: string };
  size?: "sm" | "md";
  spin?: boolean; // für den Verarbeitungs-Status im UploadZone-Flow (Loader2)
};

export function StatusPill({ icon, label, colorToken, size = "md", spin = false }: StatusPillProps) {
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding}`}
      style={{ color: colorToken.fg, background: colorToken.bg }}
    >
      {createElement(resolveIcon(icon), {
        className: `${iconSize} ${spin ? "animate-spin" : ""}`,
        strokeWidth: 2.25,
      })}
      {label}
    </span>
  );
}
