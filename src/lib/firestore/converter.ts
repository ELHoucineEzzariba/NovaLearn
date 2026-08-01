// NovaLearn – generischer Firestore-Converter: hängt die Dokument-id beim
// Lesen an, entfernt sie wieder beim Schreiben (id ist der Dokumentpfad,
// kein Feld). Eine Implementierung statt einer pro Collection (courses,
// sources, chunks, topics, questions, attempts teilen alle dasselbe Muster).

import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

export function makeConverter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(value: T) {
      const rest = { ...value };
      delete (rest as { id?: string }).id;
      return rest;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      return { id: snapshot.id, ...(snapshot.data(options) as Omit<T, "id">) } as T;
    },
  };
}
