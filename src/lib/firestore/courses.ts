// NovaLearn – Kurse anlegen/auflisten (Plan Abschnitt 4/9).
// DEMO_OWNER_ID ist der Sentinel des vorbefüllten, global lesbaren aber
// nicht editierbaren Beispiel-Kurses (siehe firestore.rules).

import { addDoc, deleteDoc, getDoc, getDocs, query, where, writeBatch, type CollectionReference } from "firebase/firestore";
import { ref, listAll, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import {
  coursesCol,
  courseDoc,
  sourcesCol,
  chunksCol,
  topicsCol,
  questionsCol,
  attemptsCol,
} from "./paths";
import type { Course } from "@/types/course";

export const DEMO_OWNER_ID = "demo-public";

export async function createCourse(uid: string, name: string): Promise<Course> {
  const ref = await addDoc(coursesCol(), {
    id: "",
    name,
    createdAt: Date.now(),
    ownerId: uid,
  });
  const snap = await getDoc(ref);
  const data = snap.data();
  if (!data) throw new Error("Kurs konnte nicht angelegt werden.");
  return data;
}

/** Eigene Kurse des Besuchers plus der global lesbare Demo-Kurs (falls vorhanden). */
export async function listCoursesForUser(uid: string): Promise<Course[]> {
  const [ownSnap, demoSnap] = await Promise.all([
    getDocs(query(coursesCol(), where("ownerId", "==", uid))),
    getDocs(query(coursesCol(), where("ownerId", "==", DEMO_OWNER_ID))),
  ]);

  const own = ownSnap.docs.map((d) => d.data());
  const demo = demoSnap.docs.map((d) => d.data());
  return [...demo, ...own].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getCourse(courseId: string): Promise<Course | null> {
  const snap = await getDoc(courseDoc(courseId));
  return snap.exists() ? snap.data() : null;
}

const BATCH_LIMIT = 400;

async function deleteAllDocs(col: CollectionReference): Promise<void> {
  const snap = await getDocs(col);
  for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

/**
 * Löscht einen Kurs vollständig: alle Subcollections (sources, chunks,
 * topics inkl. deren questions/attempts), die hochgeladenen PDFs in Storage
 * und zuletzt das Kurs-Dokument selbst. Firestore kennt kein kaskadierendes
 * Löschen im Client-SDK, daher hier manuell – Reihenfolge wichtig: das
 * Kurs-Dokument muss zuletzt gelöscht werden, weil firestore.rules beim
 * Löschen der Subcollection-Dokumente per get() den ownerId vom noch
 * existierenden Kurs-Dokument prüft.
 */
export async function deleteCourse(uid: string, courseId: string): Promise<void> {
  const topicsSnap = await getDocs(topicsCol(courseId));
  for (const topicSnap of topicsSnap.docs) {
    const questionsSnap = await getDocs(questionsCol(courseId, topicSnap.id));
    for (const questionSnap of questionsSnap.docs) {
      await deleteAllDocs(attemptsCol(courseId, topicSnap.id, questionSnap.id));
    }
    await deleteAllDocs(questionsCol(courseId, topicSnap.id));
  }
  await deleteAllDocs(topicsCol(courseId));
  await deleteAllDocs(chunksCol(courseId));
  await deleteAllDocs(sourcesCol(courseId));
  await deleteDoc(courseDoc(courseId));

  try {
    const folderRef = ref(storage, `uploads/${uid}/${courseId}`);
    const listing = await listAll(folderRef);
    await Promise.all(listing.items.map((item) => deleteObject(item)));
  } catch (err) {
    console.warn("[deleteCourse] Storage-Dateien konnten nicht vollständig entfernt werden:", err);
  }
}
