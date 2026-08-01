"use client";

// NovaLearn – meldet den Besucher beim ersten Laden anonym an (Plan
// Abschnitt 9) und stellt die uid über Context bereit. Alle Seiten, die
// Firestore-Daten scoped lesen/schreiben, hängen unter diesem Provider.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ensureAnonymousAuth } from "@/lib/firebase/client";

type AuthState = { uid: string | null; loading: boolean; error: string | null };

const AuthContext = createContext<AuthState>({ uid: null, loading: true, error: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ uid: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    ensureAnonymousAuth()
      .then((user) => {
        if (!cancelled) setState({ uid: user.uid, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            uid: null,
            loading: false,
            error: err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

/** Liefert die anonyme uid des aktuellen Besuchers (oder null solange noch geladen wird). */
export function useAuthUser(): AuthState {
  return useContext(AuthContext);
}
