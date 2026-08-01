// NovaLearn – Gemini-Client (serverseitig, NIE in Client Components importieren).
//
// Ein einziger geteilter Client für Themenextraktion, RAG-Chat, Fragen-
// Generierung, Antwortbewertung und Embeddings (Plan Abschnitt 3/5).

import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY fehlt. Bitte in .env.local setzen (siehe .env.example).",
  );
}

export const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Kostenloser Free-Tier deckt aktuell nur Flash/Flash-Lite ab (Plan Abschnitt 3).
export const GEMINI_TEXT_MODEL = "gemini-2.5-flash";
export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
