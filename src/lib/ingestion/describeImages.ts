// NovaLearn – Transkription/Beschreibung für textarme Seiten (Erweiterung
// ggü. Plan): viele reale Uploads sind keine sauberen Text-PDFs, sondern
// z.B. eingefügte Screenshots einer Quiz-Oberfläche, Whiteboard-Fotos mit
// handschriftlichen Notizen oder Foliendiagramme ohne Text-Layer. Statt
// solche Seiten mangels Text komplett zu verwerfen, lässt Gemini den
// Screenshot "vorlesen" – das Ergebnis wird wie normaler Seitentext
// weiterverarbeitet (chunk.ts/embed.ts merken den Unterschied nicht) und
// macht die Seite dadurch erst durchsuchbar/zitierbar.
//
// Batched statt ein Gemini-Aufruf pro Seite: Googles Free-Tier begrenzt
// Anfragen PRO MODELL UND TAG (teils nur 20/Tag) – bei einem Dokument mit
// vielen textarmen Seiten (z.B. 20+ Screenshot-Folien) würde ein Aufruf pro
// Seite das Tageskontingent im schlimmsten Fall mit einem einzigen Upload
// aufbrauchen.

import { Type } from "@google/genai";
import { gemini, GEMINI_TEXT_MODEL } from "@/lib/gemini/client";
import { enqueueGeminiCall } from "@/lib/gemini/queue";
import { buildMultimodalContents } from "@/lib/gemini/multimodal";
import type { PageScreenshot } from "./extractText";

const BATCH_SIZE = 8;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    pages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pageNumber: { type: Type.NUMBER },
          text: { type: Type.STRING },
        },
        required: ["pageNumber", "text"],
      },
    },
  },
  required: ["pages"],
};

function buildPrompt(pageNumbers: number[]): string {
  return `Dir werden ${pageNumbers.length} Bilder in genau dieser Reihenfolge gezeigt, zu den Seitenzahlen [${pageNumbers.join(", ")}]. Transkribiere für JEDES Bild separat sämtlichen lesbaren Text (Fragen, Antwortoptionen inkl. angekreuzter/markierter Auswahl, Tabellen, Code, handschriftliche Notizen) so vollständig wie möglich und beschreibe danach in 1-2 Sätzen etwaige Diagramme/Schaubilder. Gib für jede Seite die zugehörige pageNumber zurück (exakt wie oben angegeben, in derselben Reihenfolge) und den transkribierten Text ohne Einleitung/Kommentar.`;
}

/** Transkribiert/beschreibt mehrere Seiten-Screenshots in möglichst wenigen Gemini-Aufrufen. */
export async function describePageImages(
  screenshots: PageScreenshot[],
): Promise<Map<number, string>> {
  const result = new Map<number, string>();

  for (let i = 0; i < screenshots.length; i += BATCH_SIZE) {
    const batch = screenshots.slice(i, i + BATCH_SIZE);

    const response = await enqueueGeminiCall(() =>
      gemini.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: buildMultimodalContents(
          buildPrompt(batch.map((s) => s.pageNumber)),
          batch.map((s) => ({ mimeType: s.mimeType, dataBase64: s.dataBase64 })),
        ),
        config: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
      }),
    );

    const text = response.text;
    if (!text) continue;

    try {
      const parsed = JSON.parse(text) as { pages: { pageNumber: number; text: string }[] };
      for (const page of parsed.pages) {
        if (page.text) result.set(page.pageNumber, page.text);
      }
    } catch (err) {
      console.warn("[describePageImages] Antwort konnte nicht geparst werden:", err);
    }
  }

  return result;
}
