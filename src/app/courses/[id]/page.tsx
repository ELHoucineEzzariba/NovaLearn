"use client";

// NovaLearn – Kurs-Dashboard (Plan Abschnitt 7): Upload-Bereich, Themenliste
// mit Relevanz-Badge + Fortschritts-Ampel, Gesamtfortschritt.

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Sparkles, Percent } from "lucide-react";
import { useAuthUser } from "@/components/providers/AuthProvider";
import { UploadZone } from "@/components/upload/UploadZone";
import { TopicCard } from "@/components/topics/TopicCard";
import { getCourse } from "@/lib/firestore/courses";
import { listSources } from "@/lib/firestore/sources";
import { listChunks } from "@/lib/firestore/chunks";
import { hasTopics, listTopics, saveTopics } from "@/lib/firestore/topics";
import type { Course, CourseSource } from "@/types/course";
import type { Topic } from "@/types/topic";
import type { ExtractedTopic } from "@/lib/topics/extractTopics";

export default function CourseDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);
  const { uid } = useAuthUser();

  const [course, setCourse] = useState<Course | null>(null);
  const [sources, setSources] = useState<CourseSource[]>([]);
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function triggerRefresh() {
    setRefreshKey((k) => k + 1);
  }

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    async function load() {
      const [courseData, sourceData, topicData] = await Promise.all([
        getCourse(courseId),
        listSources(courseId),
        listTopics(courseId),
      ]);
      if (cancelled) return;
      setCourse(courseData);
      setSources(sourceData);
      setTopics(topicData);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [uid, courseId, refreshKey]);

  async function handleGenerateTopics() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const alreadyHasTopics = await hasTopics(courseId);
      if (alreadyHasTopics) {
        triggerRefresh();
        return;
      }

      const chunks = await listChunks(courseId);
      const res = await fetch(`/api/courses/${courseId}/topics/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chunks: chunks.map((c) => ({ id: c.id, text: c.text, pageRef: c.pageRef })),
        }),
      });
      if (!res.ok) throw new Error("Themenextraktion fehlgeschlagen.");
      const { topics: extracted } = (await res.json()) as { topics: ExtractedTopic[] };
      await saveTopics(
        courseId,
        extracted.map((t) => ({ ...t, courseId })),
      );
      triggerRefresh();
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setGenerating(false);
    }
  }

  if (!course) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const understoodCount = (topics ?? []).filter((t) => t.progressStatus === "verstanden").length;
  const overallProgress =
    topics && topics.length > 0 ? Math.round((understoodCount / topics.length) * 100) : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/courses" className="text-xs text-slate-400 hover:text-slate-600">
            ← Alle Kurse
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{course.name}</h1>
        </div>
        <Link
          href={`/courses/${courseId}/chat`}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
          Chat
        </Link>
      </div>

      {overallProgress !== null && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <Percent className="h-4 w-4 text-[#8A38EC]" strokeWidth={2.25} />
          <span>
            Gesamtfortschritt: <strong>{overallProgress}%</strong> ({understoodCount}/{topics?.length}{" "}
            Themen verstanden)
          </span>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-900">Material</h2>
        {sources.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-slate-500">
            {sources.map((s) => (
              <li key={s.id}>{s.fileName}</li>
            ))}
          </ul>
        )}
        {uid && (
          <div className="mt-3">
            <UploadZone courseId={courseId} uid={uid} onUploaded={triggerRefresh} />
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Themen</h2>
          {topics !== null && topics.length === 0 && sources.length > 0 && (
            <button
              onClick={handleGenerateTopics}
              disabled={generating}
              className="brand-gradient-bg inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
              )}
              Themen generieren
            </button>
          )}
        </div>

        {generateError && <p className="mt-2 text-sm text-red-600">{generateError}</p>}

        {topics === null ? null : topics.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            {sources.length === 0
              ? "Erst Material hochladen, dann lassen sich Themen extrahieren."
              : "Noch keine Themen – oben generieren lassen."}
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} courseId={courseId} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
