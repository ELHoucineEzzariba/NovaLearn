// NovaLearn – Storage-Upload (Plan Abschnitt 9: uploads/{uid}/... gescoped,
// siehe storage.rules).

import { ref, uploadBytesResumable, type UploadTaskSnapshot } from "firebase/storage";
import { storage } from "./client";

export function uploadCourseFile(
  uid: string,
  courseId: string,
  sourceId: string,
  file: File,
  onProgress?: (fraction: number) => void,
): { storagePath: string; done: Promise<void> } {
  const storagePath = `uploads/${uid}/${courseId}/${sourceId}-${file.name}`;
  const task = uploadBytesResumable(ref(storage, storagePath), file, {
    contentType: "application/pdf",
  });

  if (onProgress) {
    task.on("state_changed", (snapshot: UploadTaskSnapshot) => {
      onProgress(snapshot.bytesTransferred / snapshot.totalBytes);
    });
  }

  const done = new Promise<void>((resolve, reject) => {
    task.then(
      () => resolve(),
      (err) => reject(err),
    );
  });

  return { storagePath, done };
}
