// NovaLearn – Kursquellen (hochgeladene Dateien, Plan Abschnitt 4).

import { doc, getDoc, getDocs, orderBy, query, setDoc } from "firebase/firestore";
import { sourcesCol, sourceDoc } from "./paths";
import type { CourseSource, SourceType } from "@/types/course";

export function newSourceId(courseId: string): string {
  return doc(sourcesCol(courseId)).id;
}

export async function createSource(params: {
  sourceId: string;
  courseId: string;
  fileName: string;
  storagePath: string;
  type: SourceType;
}): Promise<CourseSource> {
  const ref = sourceDoc(params.courseId, params.sourceId);
  const value: CourseSource = {
    id: params.sourceId,
    courseId: params.courseId,
    fileName: params.fileName,
    storagePath: params.storagePath,
    type: params.type,
    uploadedAt: Date.now(),
  };
  await setDoc(ref, value);
  const snap = await getDoc(ref);
  const data = snap.data();
  if (!data) throw new Error("Quelle konnte nicht angelegt werden.");
  return data;
}

export async function listSources(courseId: string): Promise<CourseSource[]> {
  const snap = await getDocs(query(sourcesCol(courseId), orderBy("uploadedAt", "asc")));
  return snap.docs.map((d) => d.data());
}
