// NovaLearn – Firebase Client-SDK (Browser-seitig).
//
// Architekturentscheidung: Es gibt bewusst KEIN Firebase Admin SDK / keinen
// Service-Account in diesem Projekt. Alle Firestore-/Storage-Zugriffe laufen
// über dieses Client-SDK mit Anonymous Auth (Plan Abschnitt 9) – auch aus
// Client Components heraus, die von den API-Routes zurückgegebene Daten
// (KI-Ergebnisse) selbst persistieren. Die API-Routes (app/api/**) sind damit
// zustandslose KI-Proxys (Gemini-Aufrufe mit serverseitigem Key), keine
// eigene Datenbankschicht mit erhöhten Rechten. Vorteil: Firestore-Security-
// Rules (ownerId === request.auth.uid) greifen überall konsistent, ohne dass
// ein zweiter, mächtigerer Zugriffspfad am Server vorbei existiert.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);

let anonymousAuthPromise: Promise<User> | null = null;

/**
 * Meldet den Besucher anonym an (falls noch nicht geschehen) und liefert den
 * User zurück, sobald die uid feststeht. Wird von Client Components beim
 * ersten Laden aufgerufen (siehe AuthGate); ownerId auf allen Dokumenten wird
 * mit dieser uid gescoped.
 */
export function ensureAnonymousAuth(): Promise<User> {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (anonymousAuthPromise) return anonymousAuthPromise;

  anonymousAuthPromise = new Promise<User>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
        }
      },
      reject,
    );
    signInAnonymously(auth).catch((err) => {
      unsubscribe();
      reject(err);
    });
  });

  return anonymousAuthPromise;
}
