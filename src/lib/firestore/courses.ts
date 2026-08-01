// NovaLearn – Kurse anlegen/auflisten (Plan Abschnitt 4/9).
// DEMO_OWNER_ID ist der Sentinel des vorbefüllten, global lesbaren aber
// nicht editierbaren Beispiel-Kurses (siehe firestore.rules).

import { addDoc, getDoc, getDocs, query, where } from "firebase/firestore";
import { coursesCol, courseDoc } from "./paths";
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
