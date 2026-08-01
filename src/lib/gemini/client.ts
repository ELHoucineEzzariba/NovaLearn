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

// "gemini-flash-lite-latest" statt "gemini-flash-latest": Googles
// Free-Tier-Kontingent ist pro Modell UND pro Tag begrenzt
// (GenerateRequestsPerDayPerProjectPerModel-FreeTier) – für das volle
// "flash"-Modell teils nur 20 Anfragen/Tag, für die "flash-lite"-Variante
// deutlich mehr. Für unsere Aufgaben (Themen, Chat, Fragen, Bewertung,
// Bildtranskription) reicht die Qualität von Flash-Lite locker aus, inkl.
// Bildverständnis. Beide Alias-Namen werden von Google gepflegt und zeigen
// immer auf das jeweils aktuelle Modell (kein "no longer available to new
// users" wie bei fest benannten Versionen, z.B. "gemini-2.5-flash").
export const GEMINI_TEXT_MODEL = "gemini-flash-lite-latest";
export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
