// NovaLearn – Themenextraktion + Relevanz-Begründung (Plan Abschnitt 5/Schritt 2).
//
// Vereinfachung ggü. Plan: kein Batching für sehr lange Dokumente – bei
// Portfolio-Größenordnung (ein Kurs = wenige hundert Chunks) passt der
// gesamte Kontext locker in das 1M-Token-Fenster von Gemini 2.5 Flash.

import { Type } from "@google/genai";
import { gemini, GEMINI_TEXT_MODEL } from "@/lib/gemini/client";
import { enqueueGeminiCall } from "@/lib/gemini/queue";
import { buildMultimodalContents, type ImageInput } from "@/lib/gemini/multimodal";

export type TopicChunkInput = { id: string; text: string; pageRef: string | null };

export type ExtractedTopic = {
  title: string;
  description: string;
  relevanceScore: number;
  relevanceReasoning: string;
  relevanceSignals: string[];
  chunkIds: string[];
};

const RELEVANCE_SIGNALS = [
  "wiederholung_material",
  "explizite_markierung",
  "strukturelle_position",
] as const;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    topics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "kurzer, prägnanter Titel auf Deutsch" },
          description: { type: Type.STRING, description: "1-2 Sätze, für Studierende verständlich" },
          relevanceScore: { type: Type.NUMBER, description: "0 bis 100" },
          relevanceReasoning: {
            type: Type.STRING,
            description: "kurze, konkrete Begründung auf Deutsch, kein generischer Textbaustein",
          },
          relevanceSignals: {
            type: Type.ARRAY,
            items: { type: Type.STRING, enum: [...RELEVANCE_SIGNALS] },
          },
          chunkIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "chunk_id-Werte aus dem Prompt, die zu diesem Thema gehören",
          },
        },
        required: [
          "title",
          "description",
          "relevanceScore",
          "relevanceReasoning",
          "relevanceSignals",
          "chunkIds",
        ],
      },
    },
  },
  required: ["topics"],
};

function buildPrompt(chunks: TopicChunkInput[], hasImages: boolean): string {
  const body = chunks
    .map((c) => `[chunk_id: ${c.id}${c.pageRef ? " | " + c.pageRef : ""}]\n${c.text}`)
    .join("\n\n");

  const imageNote = hasImages
    ? "\n\nZusätzlich zum Text bekommst du Screenshots der Kursfolien angehängt (Diagramme, Schaubilder, Grafiken) – beziehe deren Inhalt mit ein, falls sie für ein Thema relevant sind."
    : "";

  return `Du bist ein Lernassistent, der Kursmaterial analysiert, um klausurrelevante Themen mit nachvollziehbarer Begründung zu extrahieren.

Analysiere die folgenden Text-Chunks eines Kurses und identifiziere die zentralen Themen. Für jedes Thema:
- title: kurzer, prägnanter Titel
- description: 1-2 Sätze Beschreibung
- relevanceScore: 0-100, wie wahrscheinlich klausurrelevant
- relevanceReasoning: kurze, KONKRETE Begründung auf Deutsch (kein generischer Textbaustein), basierend auf: Wiederholung im Material, expliziten Markern ("wichtig", "klausurrelevant" o.ä.), struktureller Position (eigene Kapitelüberschrift vs. Randnotiz)
- relevanceSignals: nur die tatsächlich zutreffenden Signale aus [${RELEVANCE_SIGNALS.join(", ")}]
- chunkIds: die chunk_id-Werte der Chunks, die zu diesem Thema gehören (exakt wie unten angegeben, keine erfundenen IDs)${imageNote}

Chunks:
${body}`;
}

export async function extractTopics(
  chunks: TopicChunkInput[],
  images: ImageInput[] = [],
): Promise<ExtractedTopic[]> {
  const response = await enqueueGeminiCall(() =>
    gemini.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: buildMultimodalContents(buildPrompt(chunks, images.length > 0), images),
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  );

  const text = response.text;
  if (!text) throw new Error("Gemini hat keine Themen zurückgegeben.");

  const parsed = JSON.parse(text) as { topics: ExtractedTopic[] };
  const validChunkIds = new Set(chunks.map((c) => c.id));

  return parsed.topics.map((topic) => ({
    ...topic,
    chunkIds: topic.chunkIds.filter((id) => validChunkIds.has(id)),
  }));
}
