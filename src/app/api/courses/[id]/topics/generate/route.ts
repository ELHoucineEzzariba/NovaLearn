// NovaLearn – Themenextraktion-Endpoint (Plan Abschnitt 5/Schritt 2 + 8).
// Zustandsloser KI-Proxy wie /upload: Chunks kommen vom Client (der sie per
// Firestore-Client-SDK gelesen hat), Ergebnis geht als JSON zurück, der
// Client schreibt die topics-Dokumente selbst (siehe Kommentar in
// src/lib/firebase/client.ts).

import { NextResponse } from "next/server";
import { extractTopics, type TopicChunkInput } from "@/lib/topics/extractTopics";
import type { ImageInput } from "@/lib/gemini/multimodal";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    chunks?: TopicChunkInput[];
    images?: ImageInput[];
  } | null;
  const chunks = body?.chunks ?? [];

  if (chunks.length === 0) {
    return NextResponse.json({ error: "no_chunks" }, { status: 400 });
  }

  try {
    const topics = await extractTopics(chunks, body?.images ?? []);
    return NextResponse.json({ topics });
  } catch (err) {
    console.error("[topics/generate] fehlgeschlagen:", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }
}
