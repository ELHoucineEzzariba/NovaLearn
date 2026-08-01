// NovaLearn – baut den Gemini-Kontext + die Quellenangaben-Chips aus den
// Top-k-Chunks (Plan Abschnitt 5/Schritt 3). Citations werden deterministisch
// aus den tatsächlich verwendeten Chunks abgeleitet, nicht vom Modell selbst
// zurückgegeben – so kann die Quellenangabe nicht halluziniert werden.

import type { SearchableChunk } from "./search";

export type ChatCitation = { label: string; sourceFileName: string; pageRef: string | null };

export function buildContext(chunks: SearchableChunk[]): {
  contextText: string;
  citations: ChatCitation[];
} {
  const citationsByLabel = new Map<string, ChatCitation>();

  const contextText = chunks
    .map((chunk) => {
      const label = chunk.pageRef ? `${chunk.sourceFileName}, ${chunk.pageRef}` : chunk.sourceFileName;
      citationsByLabel.set(label, { label, sourceFileName: chunk.sourceFileName, pageRef: chunk.pageRef });
      return `[Quelle: ${label}]\n${chunk.text}`;
    })
    .join("\n\n");

  return { contextText, citations: [...citationsByLabel.values()] };
}
