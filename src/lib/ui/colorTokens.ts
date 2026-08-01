// NovaLearn – Farb-Tokens.
//
// Bewusst ein HELLES, minimalistisches Theme (siehe Plan Abschnitt 11,
// Phase 6: "als Signal, dass du beide Richtungen gestalten kannst") — im
// Gegensatz zum dunklen Indigo/Violett-Theme von NovaChat/NovaFlow. Der
// Marken-Verlauf (Violett -> Blau) stammt direkt aus dem bereits
// existierenden NovaLearn-Logo (siehe public/images/brand/) und wurde per
// Pixel-Sampling daraus übernommen, keine neu erfundene Farbe.

export const BRAND = {
  gradientFrom: "#8A38EC", // aus dem Logo gesampelt (Buchrücken/linke "N"-Kante)
  gradientTo: "#05A9FB", // aus dem Logo gesampelt (rechte "N"-Kante/Pixel-Akzente)
  gradientCss: "linear-gradient(90deg, #8A38EC 0%, #05A9FB 100%)",
} as const;

export const SURFACE = {
  background: "#FFFFFF",
  backgroundSubtle: "#F8FAFC", // slate-50, für Karten/Chips auf weißem Grund
  border: "#E2E8F0", // slate-200
  textPrimary: "#0F172A", // slate-900
  textSecondary: "#475569", // slate-600
} as const;

// Relevanz-Stufen (Themenliste, Plan Abschnitt 6)
export const RELEVANCE_COLOR_TOKENS = {
  hoch: { fg: "#8A38EC", bg: "rgba(138,56,236,0.10)" },
  mittel: { fg: "#D97706", bg: "rgba(217,119,6,0.10)" }, // amber-600
  niedrig: { fg: "#64748B", bg: "rgba(100,116,139,0.10)" }, // slate-500
} as const;

// Fortschritts-Ampel pro Thema (Plan Abschnitt 5/6: nicht_begonnen/unsicher/verstanden)
export const PROGRESS_COLOR_TOKENS = {
  nicht_begonnen: { fg: "#94A3B8", bg: "rgba(148,163,184,0.12)" }, // slate-400
  unsicher: { fg: "#D97706", bg: "rgba(217,119,6,0.12)" }, // amber-600
  verstanden: { fg: "#16A34A", bg: "rgba(22,163,74,0.12)" }, // green-600
} as const;

// KI-Bewertung einer Übungsantwort (Plan Abschnitt 5/6: richtig/teilweise/falsch)
export const VERDICT_COLOR_TOKENS = {
  richtig: { fg: "#16A34A", bg: "rgba(22,163,74,0.12)" },
  teilweise: { fg: "#D97706", bg: "rgba(217,119,6,0.12)" },
  falsch: { fg: "#DC2626", bg: "rgba(220,38,38,0.12)" }, // red-600
} as const;
