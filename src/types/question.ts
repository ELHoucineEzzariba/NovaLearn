// NovaLearn – Kern-Typen für Übungsfragen & Bewertungen.
// 1:1 aus dem Build-Plan, Abschnitt 4.

export type QuestionType = "definition" | "anwendung" | "transfer";

export type AiVerdict = "richtig" | "teilweise" | "falsch";

export type Question = {
  id: string;
  topicId: string;
  questionText: string;
  questionType: QuestionType;
};

export type QuestionAttempt = {
  id: string;
  questionId: string;
  userAnswer: string;
  aiVerdict: AiVerdict;
  aiFeedback: string;
  createdAt: number;
};
