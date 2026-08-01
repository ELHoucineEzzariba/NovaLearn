// NovaLearn – PDF-Text-Extraktion, Seite für Seite (Plan Abschnitt 5/Schritt 1).
//
// pdf-parse konkateniert standardmäßig alle Seiten zu einem einzigen String
// ohne verlässliche Seitenmarker. Wir überschreiben `pagerender`, um jede
// Seite einzeln einzusammeln – nötig, damit Chunks später einen echten
// `pageRef` ("Seite 12") statt nur "irgendwo im Dokument" bekommen.

import PdfParse from "pdf-parse/lib/pdf-parse.js";
import type { PdfJsPage } from "pdf-parse-lib-internal";

export type ExtractedPage = { pageNumber: number; text: string };

export type ExtractResult =
  | { ok: true; pages: ExtractedPage[] }
  | { ok: false; reason: "no_text_layer" | "parse_error" };

// Unterhalb dieser Zeichenzahl gehen wir von einem gescannten Bild-PDF ohne
// Text-Layer aus (Plan Abschnitt 12: sichtbarer Fehlerzustand statt stillem
// Absturz / leeren Themen).
const MIN_TOTAL_CHARS = 200;

function renderPageText(textContent: { items: { str: string; transform: number[] }[] }): string {
  let lastY: number | undefined;
  let text = "";
  for (const item of textContent.items) {
    if (lastY === undefined || lastY === item.transform[5]) {
      text += item.str;
    } else {
      text += "\n" + item.str;
    }
    lastY = item.transform[5];
  }
  return text;
}

export async function extractPdfText(buffer: Buffer): Promise<ExtractResult> {
  const pages: ExtractedPage[] = [];

  try {
    await PdfParse(buffer, {
      pagerender: async (pageData: PdfJsPage) => {
        const textContent = await pageData.getTextContent({ normalizeWhitespace: true });
        const text = renderPageText(textContent);
        pages.push({ pageNumber: pageData.pageNumber, text });
        return text;
      },
    });
  } catch {
    return { ok: false, reason: "parse_error" };
  }

  const totalChars = pages.reduce((sum, page) => sum + page.text.trim().length, 0);
  if (totalChars < MIN_TOTAL_CHARS) {
    return { ok: false, reason: "no_text_layer" };
  }

  return { ok: true, pages };
}
