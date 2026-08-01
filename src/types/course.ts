// NovaLearn – Kern-Typen für Kurse & Quellen.
// 1:1 aus dem Build-Plan, Abschnitt 4 ("novalearn-detailed-plan.md").

export type SourceType = "folie" | "skript" | "uebung" | "altklausur";

export type Course = {
  id: string;
  name: string;
  createdAt: number;
  ownerId: string; // anonyme Firebase-uid, siehe Abschnitt 9
};

export type CourseSource = {
  id: string;
  courseId: string;
  fileName: string;
  storagePath: string;
  type: SourceType;
  uploadedAt: number;
};

export type CourseChunk = {
  id: string;
  courseId: string;
  sourceId: string;
  text: string;
  embedding: number[];
  pageRef: string | null;
};
