// NovaLearn – Übungs-Endpoint (Plan Abschnitt 5/Schritt 4 + 8): Fragen
// generieren ODER eine Antwort bewerten, je nach `action` im Body.
// Zustandsloser KI-Proxy wie /upload und /topics/generate.

import { NextResponse } from "next/server";
import { generateQuestions } from "@/lib/practice/generateQuestions";
import { evaluateAnswer } from "@/lib/practice/evaluateAnswer";
import type { ImageInput } from "@/lib/gemini/multimodal";

export const runtime = "nodejs";
export const maxDuration = 60;

type GenerateBody = {
  action: "generate";
  topicTitle: string;
  topicDescription: string;
  chunkTexts: string[];
  images?: ImageInput[];
};

type EvaluateBody = {
  action: "evaluate";
  questionText: string;
  chunkTexts: string[];
  userAnswer: string;
  images?: ImageInput[];
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as GenerateBody | EvaluateBody | null;

  if (!body?.action) {
    return NextResponse.json({ error: "missing_action" }, { status: 400 });
  }

  try {
    if (body.action === "generate") {
      const questions = await generateQuestions(body);
      return NextResponse.json({ questions });
    }

    if (body.action === "evaluate") {
      if (!body.userAnswer?.trim()) {
        return NextResponse.json({ error: "missing_answer" }, { status: 400 });
      }
      const result = await evaluateAnswer(body);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (err) {
    console.error("[practice] fehlgeschlagen:", err);
    return NextResponse.json({ error: "practice_failed" }, { status: 502 });
  }
}
