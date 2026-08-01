// NovaLearn – Transkription/Beschreibung für textarme Seiten (Erweiterung
// ggü. Plan): viele reale Uploads sind keine sauberen Text-PDFs, sondern
// z.B. eingefügte Screenshots einer Quiz-Oberfläche, Whiteboard-Fotos mit
// handschriftlichen Notizen oder Foliendiagramme ohne Text-Layer. Statt
// solche Seiten mangels Text komplett zu verwerfen, lässt Gemini den
// Screenshot "vorlesen" – das Ergebnis wird wie normaler Seitentext
// weiterverarbeitet (chunk.ts/embed.ts merken den Unterschied nicht) und
// macht die Seite dadurch erst durchsuchbar/zitierbar.

import { gemini, GEMINI_TEXT_MODEL } from "@/lib/gemini/client";
import { enqueueGeminiCall } from "@/lib/gemini/queue";
import { buildMultimodalContents } from "@/lib/gemini/multimodal";
import type { PageScreenshot } from "./extractText";

const PROMPT = `Transkribiere sämtlichen lesbaren Text auf diesem Bild so vollständig wie möglich (Fragen, Antwortoptionen, Tabellen, Code, handschriftliche Notizen) und beschreibe danach in 1-2 Sätzen etwaige Diagramme/Schaubilder. Antworte nur mit der Transkription/Beschreibung, ohne Einleitung oder Kommentar.`;

export async function describePageImage(screenshot: PageScreenshot): Promise<string> {
  const response = await enqueueGeminiCall(() =>
    gemini.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: buildMultimodalContents(PROMPT, [
        { mimeType: screenshot.mimeType, dataBase64: screenshot.dataBase64 },
      ]),
    }),
  );
  return response.text?.trim() ?? "";
}
