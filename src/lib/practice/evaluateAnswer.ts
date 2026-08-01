// NovaLearn – Antwortbewertung (Plan Abschnitt 5/Schritt 4). Kein separates
// Fehlerkategorie-System (Plan Abschnitt 2) – das Feedback selbst benennt
// das Problem in Prosa statt einer strukturierten Kategorie.

import { Type } from "@google/genai";
import { gemini, GEMINI_TEXT_MODEL } from "@/lib/gemini/client";
import { enqueueGeminiCall } from "@/lib/gemini/queue";
import { buildMultimodalContents, type ImageInput } from "@/lib/gemini/multimodal";
import type { AiVerdict } from "@/types/question";

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING, enum: ["richtig", "teilweise", "falsch"] },
    feedback: {
      type: Type.STRING,
      description:
        "Kurzes, konkretes Feedback auf Deutsch, das das Problem benennt (nicht nur 'richtig'/'falsch' ohne Begründung)",
    },
  },
  required: ["verdict", "feedback"],
};

export async function evaluateAnswer(params: {
  questionText: string;
  chunkTexts: string[];
  userAnswer: string;
  images?: ImageInput[];
}): Promise<{ verdict: AiVerdict; feedback: string }> {
  const { questionText, chunkTexts, userAnswer, images = [] } = params;

  const imageNote =
    images.length > 0
      ? "\n\nZusätzlich sind Screenshots der zugehörigen Folien angehängt – beziehe sie mit ein, falls die Frage oder Antwort sich auf ein Diagramm/Schaubild bezieht."
      : "";

  const prompt = `Du bist ein Lernassistent, der Freitext-Antworten von Studierenden bewertet. Bewerte die Antwort AUSSCHLIESSLICH anhand des gegebenen Kursmaterials als "richtig", "teilweise" oder "falsch" und gib ein kurzes, konkretes Feedback auf Deutsch, das erklärt, was gefehlt hat oder bestätigt, was gut war.${imageNote}

Frage: ${questionText}

Kursmaterial:
${chunkTexts.join("\n\n")}

Antwort des Studierenden: ${userAnswer}`;

  const response = await enqueueGeminiCall(() =>
    gemini.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: buildMultimodalContents(prompt, images),
      config: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
    }),
  );

  const text = response.text;
  if (!text) throw new Error("Gemini hat keine Bewertung zurückgegeben.");

  return JSON.parse(text) as { verdict: AiVerdict; feedback: string };
}
