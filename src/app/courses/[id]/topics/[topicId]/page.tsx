"use client";

// NovaLearn – Übungsansicht (Plan Abschnitt 7): Fragen anzeigen, Freitext-
// Antwort einreichen, sofortiges KI-Feedback, Fortschritts-Ampel aktualisiert
// sich danach automatisch (Plan Abschnitt 5/Schritt 5).

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { useAuthUser } from "@/components/providers/AuthProvider";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { ProgressBadge } from "@/components/ui/ProgressBadge";
import { getTopic } from "@/lib/firestore/topics";
import { listChunks } from "@/lib/firestore/chunks";
import { hasQuestions, listQuestions, saveQuestions, recordAttempt } from "@/lib/firestore/practice";
import type { Topic } from "@/types/topic";
import type { Question, AiVerdict } from "@/types/question";

export default function TopicPracticePage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { id: courseId, topicId } = use(params);
  const { uid } = useAuthUser();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [chunkTexts, setChunkTexts] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    async function load() {
      const [topicData, allChunks] = await Promise.all([
        getTopic(courseId, topicId),
        listChunks(courseId),
      ]);
      setTopic(topicData);
      const relevantChunks = allChunks.filter((c) => topicData?.chunkIds.includes(c.id));
      setChunkTexts(relevantChunks.map((c) => c.text));

      const existing = await hasQuestions(courseId, topicId);
      setQuestions(existing ? await listQuestions(courseId, topicId) : []);
    }

    void load();
  }, [uid, courseId, topicId]);

  async function handleGenerateQuestions() {
    if (!topic) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/topics/${topicId}/practice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          topicTitle: topic.title,
          topicDescription: topic.description,
          chunkTexts,
        }),
      });
      if (!res.ok) throw new Error("Fragen konnten nicht generiert werden.");
      const { questions: generated } = (await res.json()) as {
        questions: { questionType: Question["questionType"]; questionText: string }[];
      };
      const saved = await saveQuestions(courseId, topicId, generated);
      setQuestions(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmitAnswer(question: Question, answer: string) {
    const res = await fetch(`/api/topics/${topicId}/practice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "evaluate",
        questionText: question.questionText,
        chunkTexts,
        userAnswer: answer,
      }),
    });
    if (!res.ok) throw new Error("Bewertung fehlgeschlagen.");
    const result = (await res.json()) as { verdict: AiVerdict; feedback: string };

    await recordAttempt({
      courseId,
      topicId,
      questionId: question.id,
      userAnswer: answer,
      aiVerdict: result.verdict,
      aiFeedback: result.feedback,
    });

    const refreshedTopic = await getTopic(courseId, topicId);
    setTopic(refreshedTopic);

    return result;
  }

  if (!topic) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <Link href={`/courses/${courseId}`} className="text-xs text-slate-400 hover:text-slate-600">
        ← {topic.title}
      </Link>
      <div className="mt-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold text-slate-900">{topic.title}</h1>
        <ProgressBadge status={topic.progressStatus} />
      </div>
      <p className="mt-1 text-sm text-slate-500">{topic.description}</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {questions === null ? null : questions.length === 0 ? (
        <button
          onClick={handleGenerateQuestions}
          disabled={generating}
          className="brand-gradient-bg mt-6 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          )}
          Fragen generieren
        </button>
      ) : (
        <div className="mt-6 space-y-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onSubmitAnswer={(answer) => handleSubmitAnswer(question, answer)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
