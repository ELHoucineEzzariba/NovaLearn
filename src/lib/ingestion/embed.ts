// NovaLearn – Embedding der Chunks (Plan Abschnitt 5/Schritt 1 + Abschnitt 3:
// Gemini Embedding, In-Memory-Cosine-Similarity statt Vektor-DB).
//
// Batches statt ein Request pro Chunk: reduziert die Anzahl HTTP-Aufrufe
// gegen das rate-limitierte Free-Tier (Plan Abschnitt 12) deutlich, die
// eigentliche Drosselung zwischen Batches übernimmt enqueueGeminiCall.

import { gemini, GEMINI_EMBEDDING_MODEL } from "@/lib/gemini/client";
import { enqueueGeminiCall } from "@/lib/gemini/queue";
import type { RawChunk } from "./chunk";

const BATCH_SIZE = 10;

export type EmbeddedChunk = RawChunk & { embedding: number[] };

export async function embedChunks(chunks: RawChunk[]): Promise<EmbeddedChunk[]> {
  const result: EmbeddedChunk[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const response = await enqueueGeminiCall(() =>
      gemini.models.embedContent({
        model: GEMINI_EMBEDDING_MODEL,
        contents: batch.map((chunk) => chunk.text),
      }),
    );

    const embeddings = response.embeddings ?? [];
    batch.forEach((chunk, idx) => {
      const values = embeddings[idx]?.values;
      if (!values) {
        throw new Error(`Embedding fehlgeschlagen für Chunk ${i + idx}.`);
      }
      result.push({ ...chunk, embedding: values });
    });
  }

  return result;
}

/** Embeddet eine einzelne Nutzerfrage (RAG-Chat, Plan Abschnitt 5/Schritt 3). */
export async function embedText(text: string): Promise<number[]> {
  const response = await enqueueGeminiCall(() =>
    gemini.models.embedContent({ model: GEMINI_EMBEDDING_MODEL, contents: text }),
  );
  const values = response.embeddings?.[0]?.values;
  if (!values) throw new Error("Embedding der Anfrage fehlgeschlagen.");
  return values;
}
