// NovaLearn – Chunk-Persistenz (Plan Abschnitt 4/5/Schritt 1).
// Batched Writes statt einzelner addDoc-Aufrufe: ein Foliensatz erzeugt
// leicht hundert+ Chunks, das spart Roundtrips und ist atomar pro Batch.

import { doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { chunksCol } from "./paths";
import type { CourseChunk } from "@/types/course";
import type { EmbeddedChunk } from "@/lib/ingestion/embed";

const FIRESTORE_BATCH_LIMIT = 400; // unter dem harten Limit von 500 Writes/Batch

export async function saveChunks(
  courseId: string,
  sourceId: string,
  chunks: EmbeddedChunk[],
): Promise<void> {
  const col = chunksCol(courseId);

  for (let i = 0; i < chunks.length; i += FIRESTORE_BATCH_LIMIT) {
    const slice = chunks.slice(i, i + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const chunk of slice) {
      const ref = doc(col);
      const value: CourseChunk = {
        id: ref.id,
        courseId,
        sourceId,
        text: chunk.text,
        embedding: chunk.embedding,
        pageRef: chunk.pageRef,
        pageNumbers: chunk.pageNumbers,
      };
      batch.set(ref, value);
    }
    await batch.commit();
  }
}

export async function listChunks(courseId: string): Promise<CourseChunk[]> {
  const snap = await getDocs(chunksCol(courseId));
  return snap.docs.map((d) => d.data());
}
