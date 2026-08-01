// NovaLearn – baut den Gemini-Kontext + die Quellenangaben-Chips aus den
// Top-k-Chunks (Plan Abschnitt 5/Schritt 3). Citations werden deterministisch
// aus den tatsächlich verwendeten Chunks abgeleitet, nicht vom Modell selbst
// zurückgegeben – so kann die Quellenangabe nicht halluziniert werden.
//
// Erweiterung ggü. Plan: zusätzlich werden die Seiten-Screenshots der
// tatsächlich verwendeten Chunks aus dem verfügbaren Bilder-Pool
// herausgefiltert, damit Gemini Diagramme/Schaubilder auf diesen Seiten
// "sehen" kann statt nur den reinen Text.

import type { SearchableChunk } from "./search";
import type { CoursePageImage } from "@/types/course";

export type ChatCitation = { label: string; sourceFileName: string; pageRef: string | null };

export function buildContext(
  chunks: SearchableChunk[],
  availablePageImages: CoursePageImage[] = [],
): {
  contextText: string;
  citations: ChatCitation[];
  images: CoursePageImage[];
} {
  const citationsByLabel = new Map<string, ChatCitation>();
  const neededPageKeys = new Set<string>();

  const contextText = chunks
    .map((chunk) => {
      const label = chunk.pageRef ? `${chunk.sourceFileName}, ${chunk.pageRef}` : chunk.sourceFileName;
      citationsByLabel.set(label, { label, sourceFileName: chunk.sourceFileName, pageRef: chunk.pageRef });
      for (const pageNumber of chunk.pageNumbers) {
        neededPageKeys.add(`${chunk.sourceId}_${pageNumber}`);
      }
      return `[Quelle: ${label}]\n${chunk.text}`;
    })
    .join("\n\n");

  const images = availablePageImages.filter((img) =>
    neededPageKeys.has(`${img.sourceId}_${img.pageNumber}`),
  );

  return { contextText, citations: [...citationsByLabel.values()], images };
}
