// NovaLearn – Übungsfragen, Antwortversuche & Fortschrittslogik
// (Plan Abschnitt 4/5/Schritt 4 + 5).

import { addDoc, doc, getDocs, limit, orderBy, query, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { attemptsCol, questionsCol } from "./paths";
import { updateTopicProgress } from "./topics";
import type { AiVerdict, Question, QuestionAttempt, QuestionType } from "@/types/question";
import type { ProgressStatus } from "@/types/topic";

export type NewQuestion = { questionText: string; questionType: QuestionType };

export async function hasQuestions(courseId: string, topicId: string): Promise<boolean> {
  const snap = await getDocs(questionsCol(courseId, topicId));
  return !snap.empty;
}

export async function saveQuestions(
  courseId: string,
  topicId: string,
  questions: NewQuestion[],
): Promise<Question[]> {
  const col = questionsCol(courseId, topicId);
  const batch = writeBatch(db);
  const values: Question[] = questions.map((q) => {
    const ref = doc(col);
    const value: Question = { id: ref.id, topicId, ...q };
    batch.set(ref, value);
    return value;
  });
  await batch.commit();
  return values;
}

export async function listQuestions(courseId: string, topicId: string): Promise<Question[]> {
  const snap = await getDocs(questionsCol(courseId, topicId));
  return snap.docs.map((d) => d.data());
}

const RECENT_ATTEMPTS_PER_QUESTION = 5;

function computeProgressStatus(mostRecentFirst: AiVerdict[]): ProgressStatus {
  if (mostRecentFirst.length === 0) return "nicht_begonnen";
  if (mostRecentFirst[0] === "richtig" && mostRecentFirst[1] === "richtig") return "verstanden";
  return "unsicher";
}

/**
 * Speichert einen Antwortversuch und aktualisiert danach die Fortschritts-
 * Ampel des Themas. Da attempts pro Frage liegen (Plan-Schema), aber der
 * Fortschritt pro THEMA gilt, werden dafür die letzten Versuche über alle
 * Fragen des Themas hinweg zusammengeführt (ein Thema hat nur 3 Fragen mit
 * wenigen Versuchen – für diese Größenordnung reicht das ohne zusätzliches
 * denormalisiertes Feld).
 */
export async function recordAttempt(params: {
  courseId: string;
  topicId: string;
  questionId: string;
  userAnswer: string;
  aiVerdict: AiVerdict;
  aiFeedback: string;
}): Promise<void> {
  const { courseId, topicId, questionId, userAnswer, aiVerdict, aiFeedback } = params;

  await addDoc(attemptsCol(courseId, topicId, questionId), {
    id: "",
    questionId,
    userAnswer,
    aiVerdict,
    aiFeedback,
    createdAt: Date.now(),
  } satisfies QuestionAttempt);

  const recent = await getRecentTopicVerdicts(courseId, topicId);
  await updateTopicProgress(courseId, topicId, computeProgressStatus(recent));
}

async function getRecentTopicVerdicts(courseId: string, topicId: string): Promise<AiVerdict[]> {
  const questions = await getDocs(questionsCol(courseId, topicId));

  const perQuestionAttempts = await Promise.all(
    questions.docs.map(async (questionSnap) => {
      const snap = await getDocs(
        query(
          attemptsCol(courseId, topicId, questionSnap.id),
          orderBy("createdAt", "desc"),
          limit(RECENT_ATTEMPTS_PER_QUESTION),
        ),
      );
      return snap.docs.map((d) => d.data());
    }),
  );

  return perQuestionAttempts
    .flat()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((attempt) => attempt.aiVerdict);
}

export async function listAttempts(
  courseId: string,
  topicId: string,
  questionId: string,
): Promise<QuestionAttempt[]> {
  const snap = await getDocs(
    query(attemptsCol(courseId, topicId, questionId), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => d.data());
}
