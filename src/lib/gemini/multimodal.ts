// NovaLearn – Hilfsfunktion für multimodale Gemini-Aufrufe: hängt
// Seiten-Screenshots (Diagramme/Schaubilder, die reine Text-Extraktion nicht
// erfasst) als inlineData-Parts neben den Prompt-Text.

import type { Part } from "@google/genai";

export type ImageInput = { mimeType: string; dataBase64: string };

export function buildMultimodalContents(promptText: string, images: ImageInput[]): Part[] {
  const parts: Part[] = [{ text: promptText }];
  for (const image of images) {
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.dataBase64 } });
  }
  return parts;
}
