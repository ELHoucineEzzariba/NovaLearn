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

// "gemini-flash-latest" ist ein von Google gepflegter Alias auf das jeweils
// aktuelle kostenlose Flash-Modell (Plan Abschnitt 3) – fest benannte
// Versionen (z.B. "gemini-2.5-flash") werden von Google nach einer Weile für
// neue API-Keys gesperrt ("no longer available to new users"), der Alias
// bleibt dagegen dauerhaft nutzbar.
export const GEMINI_TEXT_MODEL = "gemini-flash-latest";
export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
