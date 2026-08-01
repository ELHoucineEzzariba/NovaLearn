// NovaLearn – Chunking (Plan Abschnitt 5/Schritt 1: "nicht stur nach
// Zeichenzahl"). Wir chunken absatzweise: Absätze werden bis zu einer
// Zielgröße zusammengefasst, ein einzelner überlanger Absatz wird an
// Satzgrenzen weiter aufgeteilt. Jeder Chunk trägt eine Seitenreferenz für
// Quellenangaben im RAG-Chat (Plan Abschnitt 5/Schritt 3).

import type { ExtractedPage } from "./extractText";

export type RawChunk = { text: string; pageRef: string | null; pageNumbers: number[] };

const TARGET_CHUNK_SIZE = 1200;
const MAX_CHUNK_SIZE = 1800;

function pageRefLabel(pageNumbers: Set<number>): string | null {
  if (pageNumbers.size === 0) return null;
  const sorted = [...pageNumbers].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return first === last ? `Seite ${first}` : `Seite ${first}–${last}`;
}

function splitLongParagraph(text: string, maxSize: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const pieces: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current && current.length + sentence.length + 1 > maxSize) {
      pieces.push(current.trim());
      current = "";
    }
    current += (current ? " " : "") + sentence;
  }
  if (current.trim()) pieces.push(current.trim());
  return pieces;
}

export function chunkPages(pages: ExtractedPage[]): RawChunk[] {
  const chunks: RawChunk[] = [];
  let buffer = "";
  let bufferPages = new Set<number>();

  function flush() {
    const trimmed = buffer.trim();
    if (trimmed) {
      chunks.push({
        text: trimmed,
        pageRef: pageRefLabel(bufferPages),
        pageNumbers: [...bufferPages].sort((a, b) => a - b),
      });
    }
    buffer = "";
    bufferPages = new Set();
  }

  for (const page of pages) {
    const paragraphs = page.text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const paragraph of paragraphs) {
      if (paragraph.length > MAX_CHUNK_SIZE) {
        flush();
        for (const piece of splitLongParagraph(paragraph, MAX_CHUNK_SIZE)) {
          chunks.push({
            text: piece,
            pageRef: pageRefLabel(new Set([page.pageNumber])),
            pageNumbers: [page.pageNumber],
          });
        }
        continue;
      }

      if (buffer && buffer.length + paragraph.length > TARGET_CHUNK_SIZE) {
        flush();
      }
      buffer += (buffer ? "\n\n" : "") + paragraph;
      bufferPages.add(page.pageNumber);
    }
  }
  flush();

  return chunks;
}
