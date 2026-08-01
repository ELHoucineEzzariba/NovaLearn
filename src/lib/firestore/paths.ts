// NovaLearn – typisierte Collection-/Doc-Referenzen für die Struktur aus
// Plan Abschnitt 4. Zentral gehalten, damit Pfad-Strings nicht an mehreren
// Stellen dupliziert werden.

import { collection, doc, type CollectionReference, type DocumentReference } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { makeConverter } from "./converter";
import type { Course, CourseSource, CourseChunk } from "@/types/course";
import type { Topic } from "@/types/topic";
import type { Question, QuestionAttempt } from "@/types/question";

const coursesConverter = makeConverter<Course>();
const sourcesConverter = makeConverter<CourseSource>();
const chunksConverter = makeConverter<CourseChunk>();
const topicsConverter = makeConverter<Topic>();
const questionsConverter = makeConverter<Question>();
const attemptsConverter = makeConverter<QuestionAttempt>();

export function coursesCol(): CollectionReference<Course> {
  return collection(db, "courses").withConverter(coursesConverter);
}

export function courseDoc(courseId: string): DocumentReference<Course> {
  return doc(coursesCol(), courseId);
}

export function sourcesCol(courseId: string): CollectionReference<CourseSource> {
  return collection(courseDoc(courseId), "sources").withConverter(sourcesConverter);
}

export function sourceDoc(courseId: string, sourceId: string): DocumentReference<CourseSource> {
  return doc(sourcesCol(courseId), sourceId);
}

export function chunksCol(courseId: string): CollectionReference<CourseChunk> {
  return collection(courseDoc(courseId), "chunks").withConverter(chunksConverter);
}

export function topicsCol(courseId: string): CollectionReference<Topic> {
  return collection(courseDoc(courseId), "topics").withConverter(topicsConverter);
}

export function topicDoc(courseId: string, topicId: string): DocumentReference<Topic> {
  return doc(topicsCol(courseId), topicId);
}

export function questionsCol(courseId: string, topicId: string): CollectionReference<Question> {
  return collection(topicDoc(courseId, topicId), "questions").withConverter(questionsConverter);
}

export function questionDoc(
  courseId: string,
  topicId: string,
  questionId: string,
): DocumentReference<Question> {
  return doc(questionsCol(courseId, topicId), questionId);
}

export function attemptsCol(
  courseId: string,
  topicId: string,
  questionId: string,
): CollectionReference<QuestionAttempt> {
  return collection(questionDoc(courseId, topicId, questionId), "attempts").withConverter(
    attemptsConverter,
  );
}
