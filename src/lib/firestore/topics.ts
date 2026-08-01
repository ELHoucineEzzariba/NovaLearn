// NovaLearn – Themen-Persistenz (Plan Abschnitt 4/5/Schritt 2 + 5).
//
// Bewusste Vereinfachung: Themen werden nur EINMAL pro Kurs generiert (nicht
// bei jedem Seitenaufruf neu, Plan Abschnitt 12 – Themenextraktion ist ein
// teurer Aufruf mit großem Kontext). Ein "Neu generieren" würde zudem verwaiste
// questions/attempts-Subcollections hinterlassen (Firestore kennt kein
// kaskadierendes Löschen im Client-SDK) – für den Portfolio-Scope bewusst
// nicht gebaut, siehe novalearn-detailed-plan.md Abschnitt 2.

import { doc, getDoc, getDocs, orderBy, query, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { topicsCol, topicDoc } from "./paths";
import type { ProgressStatus, Topic } from "@/types/topic";

export type NewTopic = Omit<Topic, "id" | "progressStatus" | "progressUpdatedAt">;

export async function hasTopics(courseId: string): Promise<boolean> {
  const snap = await getDocs(topicsCol(courseId));
  return !snap.empty;
}

export async function saveTopics(courseId: string, topics: NewTopic[]): Promise<void> {
  const col = topicsCol(courseId);
  const batch = writeBatch(db);
  for (const topic of topics) {
    const ref = doc(col);
    const value: Topic = {
      ...topic,
      id: ref.id,
      progressStatus: "nicht_begonnen",
      progressUpdatedAt: Date.now(),
    };
    batch.set(ref, value);
  }
  await batch.commit();
}

export async function listTopics(courseId: string): Promise<Topic[]> {
  const snap = await getDocs(query(topicsCol(courseId), orderBy("relevanceScore", "desc")));
  return snap.docs.map((d) => d.data());
}

export async function getTopic(courseId: string, topicId: string): Promise<Topic | null> {
  const snap = await getDoc(topicDoc(courseId, topicId));
  return snap.exists() ? snap.data() : null;
}

export async function updateTopicProgress(
  courseId: string,
  topicId: string,
  status: ProgressStatus,
): Promise<void> {
  await updateDoc(topicDoc(courseId, topicId), {
    progressStatus: status,
    progressUpdatedAt: Date.now(),
  });
}
