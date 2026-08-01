// NovaLearn – Persistenz für Seiten-Screenshots (visueller Kontext für
// Diagramme/Schaubilder, Erweiterung ggü. Plan Abschnitt 4/5).

import { doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { pageImagesCol } from "./paths";
import type { CoursePageImage } from "@/types/course";
import type { PageScreenshot } from "@/lib/ingestion/extractText";

const FIRESTORE_BATCH_LIMIT = 400;

export function pageImageId(sourceId: string, pageNumber: number): string {
  return `${sourceId}_${pageNumber}`;
}

export async function savePageImages(
  courseId: string,
  sourceId: string,
  screenshots: PageScreenshot[],
): Promise<void> {
  const col = pageImagesCol(courseId);

  for (let i = 0; i < screenshots.length; i += FIRESTORE_BATCH_LIMIT) {
    const slice = screenshots.slice(i, i + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const shot of slice) {
      const id = pageImageId(sourceId, shot.pageNumber);
      const value: CoursePageImage = {
        id,
        courseId,
        sourceId,
        pageNumber: shot.pageNumber,
        mimeType: shot.mimeType,
        dataBase64: shot.dataBase64,
      };
      batch.set(doc(col, id), value);
    }
    await batch.commit();
  }
}

export async function listPageImages(courseId: string): Promise<CoursePageImage[]> {
  const snap = await getDocs(pageImagesCol(courseId));
  return snap.docs.map((d) => d.data());
}
