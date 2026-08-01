"use client";

// NovaLearn – Kursliste (Plan Abschnitt 7: app/courses/page.tsx).

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, BookOpen } from "lucide-react";
import { useAuthUser } from "@/components/providers/AuthProvider";
import { createCourse, listCoursesForUser, DEMO_OWNER_ID } from "@/lib/firestore/courses";
import type { Course } from "@/types/course";

export default function CoursesPage() {
  const { uid, loading: authLoading, error: authError } = useAuthUser();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    listCoursesForUser(uid)
      .then(setCourses)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Kurse konnten nicht geladen werden."));
  }, [uid]);

  async function handleCreate() {
    if (!uid || !newName.trim()) return;
    setCreating(true);
    try {
      const course = await createCourse(uid, newName.trim());
      setCourses((prev) => [course, ...(prev ?? [])]);
      setNewName("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Kurs konnte nicht angelegt werden.");
    } finally {
      setCreating(false);
    }
  }

  if (authLoading || (uid && courses === null && !loadError)) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="mx-auto max-w-md py-24 text-center text-sm text-red-600">{authError}</div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Deine Kurse</h1>
      <p className="mt-1 text-sm text-slate-500">
        Kursmaterial hochladen, Themen extrahieren lassen, chatten und aktiv üben.
      </p>

      <div className="mt-8 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Name des neuen Kurses"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="brand-gradient-bg inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          Neuer Kurs
        </button>
      </div>

      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}

      <ul className="mt-8 space-y-2">
        {(courses ?? []).map((course) => (
          <li key={course.id}>
            <Link
              href={`/courses/${course.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-colors hover:border-[#8A38EC]/40 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2 font-medium text-slate-900">
                <BookOpen className="h-4 w-4 text-slate-400" strokeWidth={2} />
                {course.name}
              </span>
              {course.ownerId === DEMO_OWNER_ID && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  Beispiel-Kurs
                </span>
              )}
            </Link>
          </li>
        ))}
        {courses !== null && courses.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
            Noch keine Kurse – leg oben deinen ersten an.
          </li>
        )}
      </ul>
    </div>
  );
}
