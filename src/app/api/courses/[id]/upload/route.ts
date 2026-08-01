// NovaLearn – Ingestion-Endpoint (Plan Abschnitt 5/Schritt 1 + 8).
//
// Zustandsloser KI-Proxy: nimmt die rohen PDF-Bytes entgegen, extrahiert Text,
// chunked und embedded serverseitig (GEMINI_API_KEY bleibt hier), gibt die
// fertigen Chunks aber nur als JSON zurück. Das Schreiben nach Firestore
// (courses/{id}/chunks) übernimmt der Client mit seiner Anonymous-Auth-uid –
// siehe Kommentar in src/lib/firebase/client.ts für die Begründung.

import { NextResponse } from "next/server";
import { extractPdfText, type ExtractedPage, type PageScreenshot } from "@/lib/ingestion/extractText";
import { describePageImage } from "@/lib/ingestion/describeImages";
import { chunkPages } from "@/lib/ingestion/chunk";
import { embedChunks } from "@/lib/ingestion/embed";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// Ab dieser Zeichenzahl gilt eine Seite als "textarm" (z.B. eingefügter
// Screenshot ohne Text-Layer) und bekommt ihren Text per Gemini-Vision aus
// dem Screenshot transkribiert statt roh (fast leer) in die Chunks zu gehen
// – sonst wäre die Seite über Cosine-Similarity nie auffindbar.
const MIN_PAGE_TEXT_CHARS = 40;

async function enrichSparsePages(
  pages: ExtractedPage[],
  screenshots: PageScreenshot[],
): Promise<ExtractedPage[]> {
  const screenshotByPage = new Map(screenshots.map((s) => [s.pageNumber, s]));

  return Promise.all(
    pages.map(async (page) => {
      if (page.text.trim().length >= MIN_PAGE_TEXT_CHARS) return page;
      const screenshot = screenshotByPage.get(page.pageNumber);
      if (!screenshot) return page;
      try {
        const description = await describePageImage(screenshot);
        return description ? { ...page, text: description } : page;
      } catch (err) {
        console.warn(`[upload] Bildbeschreibung für Seite ${page.pageNumber} fehlgeschlagen:`, err);
        return page;
      }
    }),
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "not_a_pdf" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const extracted = await extractPdfText(buffer);
  if (!extracted.ok) {
    return NextResponse.json({ error: extracted.reason }, { status: 422 });
  }

  const enrichedPages = await enrichSparsePages(extracted.pages, extracted.screenshots);
  const rawChunks = chunkPages(enrichedPages);
  if (rawChunks.length === 0) {
    return NextResponse.json({ error: "no_text_layer" }, { status: 422 });
  }

  try {
    const embedded = await embedChunks(rawChunks);
    return NextResponse.json({ chunks: embedded, screenshots: extracted.screenshots });
  } catch (err) {
    console.error("[upload] Embedding fehlgeschlagen:", err);
    return NextResponse.json({ error: "embedding_failed" }, { status: 502 });
  }
}
