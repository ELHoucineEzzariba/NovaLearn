// NovaLearn – client-seitige Ingestion-Orchestrierung: verbindet
// Storage-Upload, den serverseitigen Extraktions-/Chunking-/Embedding-Aufruf
// und das Schreiben nach Firestore (Plan Abschnitt 5/Schritt 1 + 8,
// UploadZone.tsx). Läuft im Browser, ruft nur den API-Proxy per fetch auf –
// GEMINI_API_KEY bleibt serverseitig in src/lib/gemini/client.ts.

import { newSourceId, createSource } from "@/lib/firestore/sources";
import { saveChunks } from "@/lib/firestore/chunks";
import { uploadCourseFile } from "@/lib/firebase/storage";
import type { SourceType } from "@/types/course";
import type { EmbeddedChunk } from "./embed";

export type IngestionStage = "hochladen" | "verarbeiten" | "speichern" | "fertig";

export class IngestionError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export async function runIngestion(params: {
  uid: string;
  courseId: string;
  file: File;
  sourceType: SourceType;
  onStage?: (stage: IngestionStage) => void;
  onUploadProgress?: (fraction: number) => void;
}): Promise<void> {
  const { uid, courseId, file, sourceType, onStage, onUploadProgress } = params;

  const sourceId = newSourceId(courseId);

  onStage?.("hochladen");
  const { storagePath, done } = uploadCourseFile(uid, courseId, sourceId, file, onUploadProgress);
  await done;

  onStage?.("verarbeiten");
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`/api/courses/${courseId}/upload`, { method: "POST", body: formData });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new IngestionError(body.error ?? "unknown");
  }
  const { chunks } = (await res.json()) as { chunks: EmbeddedChunk[] };

  onStage?.("speichern");
  await createSource({ sourceId, courseId, fileName: file.name, storagePath, type: sourceType });
  await saveChunks(courseId, sourceId, chunks);

  onStage?.("fertig");
}
