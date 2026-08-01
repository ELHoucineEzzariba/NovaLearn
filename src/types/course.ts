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
  pageNumbers: number[]; // für die Zuordnung zu CoursePageImage (visueller Kontext)
};

// Seiten-Screenshot (Erweiterung ggü. Plan): visueller Kontext für Diagramme
// und Schaubilder, die reine Text-Extraktion nicht erfasst (z.B.
// vektorgezeichnete Schaubilder ohne eingebettetes Rasterbild). Eine pro
// Seite statt pro Chunk, damit mehrere Chunks derselben Seite sich das Bild
// teilen (kein redundantes Speichern).
export type CoursePageImage = {
  id: string; // `${sourceId}_${pageNumber}`
  courseId: string;
  sourceId: string;
  pageNumber: number;
  mimeType: string;
  dataBase64: string;
};
