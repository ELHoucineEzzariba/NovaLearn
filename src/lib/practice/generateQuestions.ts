// NovaLearn – Fragen-Generator (Plan Abschnitt 5/Schritt 4): pro Thema je
// eine Definitions-, Anwendungs- und Transfer-Frage aus den zugehörigen Chunks.

import { Type } from "@google/genai";
import { gemini, GEMINI_TEXT_MODEL } from "@/lib/gemini/client";
import { enqueueGeminiCall } from "@/lib/gemini/queue";
import type { QuestionType } from "@/types/question";

export type GeneratedQuestion = { questionType: QuestionType; questionText: string };

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionType: { type: Type.STRING, enum: ["definition", "anwendung", "transfer"] },
          questionText: { type: Type.STRING },
        },
        required: ["questionType", "questionText"],
      },
    },
  },
  required: ["questions"],
};

export async function generateQuestions(params: {
  topicTitle: string;
  topicDescription: string;
  chunkTexts: string[];
}): Promise<GeneratedQuestion[]> {
  const { topicTitle, topicDescription, chunkTexts } = params;

  const prompt = `Du bist ein Lernassistent. Erstelle zu folgendem Thema genau drei Freitext-Übungsfragen auf Deutsch: eine Definitionsfrage (questionType "definition", fragt nach Begriff/Konzept), eine Anwendungsfrage (questionType "anwendung", verlangt Anwendung des Konzepts auf ein konkretes Beispiel) und eine Transferfrage (questionType "transfer", verlangt Übertragung auf einen neuen Kontext oder Vergleich mit einem verwandten Konzept). Die Fragen müssen mit Freitext beantwortbar sein, kein Multiple-Choice.

Thema: ${topicTitle}
Beschreibung: ${topicDescription}

Relevantes Kursmaterial:
${chunkTexts.join("\n\n")}`;

  const response = await enqueueGeminiCall(() =>
    gemini.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
    }),
  );

  const text = response.text;
  if (!text) throw new Error("Gemini hat keine Fragen zurückgegeben.");

  const parsed = JSON.parse(text) as { questions: GeneratedQuestion[] };
  return parsed.questions;
}
