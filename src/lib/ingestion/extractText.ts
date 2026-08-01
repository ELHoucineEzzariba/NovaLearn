// NovaLearn – PDF-Extraktion, Seite für Seite (Plan Abschnitt 5/Schritt 1
// + Erweiterung: Seiten-Screenshots für Diagramme/Grafiken, die reine
// Text-Extraktion nicht erfasst – z.B. vektorgezeichnete Schaubilder auf
// Folien, die kein eingebettetes Rasterbild sind).
//
// pdf-parse v2 (auf pdfjs-dist + @napi-rs/canvas aufbauend, vorkompilierte
// Binaries, kein natives Canvas-Kompilieren nötig) liefert beides über
// dieselbe PDFParse-Instanz: getText() für Seitentext, getScreenshot() für
// ein gerendertes PNG pro Seite.

import { PDFParse } from "pdf-parse";

export type ExtractedPage = { pageNumber: number; text: string };
export type PageScreenshot = { pageNumber: number; mimeType: string; dataBase64: string };

export type ExtractResult =
  | { ok: true; pages: ExtractedPage[]; screenshots: PageScreenshot[] }
  | { ok: false; reason: "no_text_layer" | "parse_error" };

// Unterhalb dieser Zeichenzahl gehen wir von einem gescannten Bild-PDF ohne
// Text-Layer aus (Plan Abschnitt 12: sichtbarer Fehlerzustand statt stillem
// Absturz / leeren Themen).
const MIN_TOTAL_CHARS = 200;

// Screenshot-Auflösung: breit genug, um Diagramm-Beschriftungen lesbar zu
// halten, aber klein genug für Firestore-Dokumentgröße (1 MiB/Doc) und
// vertretbare Gemini-Multimodal-Payloads.
const SCREENSHOT_WIDTH = 700;

// Sehr lange Dokumente bekommen keine Screenshots mehr ab dieser Seitenzahl
// (Chunks/Text funktionieren weiterhin, nur ohne visuellen Kontext) – schützt
// vor exzessiven Storage-/Payload-Größen bei untypisch langen Uploads.
const MAX_SCREENSHOT_PAGES = 60;

function parseDataUrl(dataUrl: string): { mimeType: string; dataBase64: string } {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error("Unerwartetes Screenshot-Format von pdf-parse.");
  return { mimeType: match[1], dataBase64: match[2] };
}

export async function extractPdfText(buffer: Buffer): Promise<ExtractResult> {
  const parser = new PDFParse({ data: buffer });

  try {
    const textResult = await parser.getText();
    const pages: ExtractedPage[] = textResult.pages.map((p) => ({ pageNumber: p.num, text: p.text }));

    const totalChars = pages.reduce((sum, page) => sum + page.text.trim().length, 0);
    if (totalChars < MIN_TOTAL_CHARS) {
      return { ok: false, reason: "no_text_layer" };
    }

    let screenshots: PageScreenshot[] = [];
    try {
      const shouldScreenshot = pages.length <= MAX_SCREENSHOT_PAGES;
      if (shouldScreenshot) {
        const screenshotResult = await parser.getScreenshot({
          desiredWidth: SCREENSHOT_WIDTH,
          imageDataUrl: true,
          imageBuffer: false,
        });
        screenshots = screenshotResult.pages.map((s) => ({
          pageNumber: s.pageNumber,
          ...parseDataUrl(s.dataUrl),
        }));
      }
    } catch (err) {
      // Screenshots sind ein Zusatznutzen (visueller Kontext) – schlägt das
      // Rendering fehl, degradiert die Ingestion auf reinen Text statt ganz
      // abzubrechen.
      console.warn("[extractPdfText] Screenshot-Rendering fehlgeschlagen:", err);
    }

    return { ok: true, pages, screenshots };
  } catch {
    return { ok: false, reason: "parse_error" };
  } finally {
    await parser.destroy();
  }
}
