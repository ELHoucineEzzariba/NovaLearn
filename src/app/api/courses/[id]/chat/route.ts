// NovaLearn – RAG-Chat-Endpoint (Plan Abschnitt 5/Schritt 3 + 8).
// Client schickt Frage + alle Chunks des Kurses (bereits um sourceFileName
// angereichert) sowie die verfügbaren Seiten-Screenshots, Server embeddet
// die Frage, berechnet Cosine-Similarity gegen die Chunk-Embeddings HIER in
// der Route (Plan-Vorgabe), baut den Kontext für Gemini (Text + die
// Screenshots der tatsächlich zitierten Seiten) und liefert Antwort +
// deterministische Quellenangaben.

import { NextResponse } from "next/server";
import { gemini, GEMINI_TEXT_MODEL } from "@/lib/gemini/client";
import { enqueueGeminiCall } from "@/lib/gemini/queue";
import { embedText } from "@/lib/ingestion/embed";
import { buildMultimodalContents } from "@/lib/gemini/multimodal";
import { topKChunks, type SearchableChunk } from "@/lib/rag/search";
import { buildContext } from "@/lib/rag/buildContext";
import type { CoursePageImage } from "@/types/course";

export const runtime = "nodejs";
export const maxDuration = 60;

const TOP_K = 6;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    question?: string;
    chunks?: SearchableChunk[];
    pageImages?: CoursePageImage[];
  } | null;

  const question = body?.question?.trim();
  const chunks = body?.chunks ?? [];

  if (!question) {
    return NextResponse.json({ error: "missing_question" }, { status: 400 });
  }
  if (chunks.length === 0) {
    return NextResponse.json({ error: "no_material" }, { status: 400 });
  }

  try {
    const queryEmbedding = await embedText(question);
    const top = topKChunks(queryEmbedding, chunks, TOP_K);
    const { contextText, citations, images } = buildContext(top, body?.pageImages ?? []);

    const exampleLabel = citations[0]?.label ?? "Folie 3";
    const imageNote =
      images.length > 0
        ? "\n\nZusätzlich sind Screenshots der zitierten Folien angehängt – beziehe Diagramme/Schaubilder darauf mit ein, falls für die Antwort relevant."
        : "";
    const prompt = `Du bist ein Lernassistent. Beantworte die folgende Frage AUSSCHLIESSLICH anhand des gegebenen Kursmaterial-Kontexts. Wenn die Antwort nicht im Kontext enthalten ist, sag das ehrlich statt zu raten. Zitiere im Fließtext die Quelle in der Form "laut ${exampleLabel}".${imageNote}

Kontext:
${contextText}

Frage: ${question}`;

    const response = await enqueueGeminiCall(() =>
      gemini.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: buildMultimodalContents(
          prompt,
          images.map((img) => ({ mimeType: img.mimeType, dataBase64: img.dataBase64 })),
        ),
      }),
    );

    return NextResponse.json({ answer: response.text ?? "", citations });
  } catch (err) {
    console.error("[chat] fehlgeschlagen:", err);
    return NextResponse.json({ error: "chat_failed" }, { status: 502 });
  }
}
