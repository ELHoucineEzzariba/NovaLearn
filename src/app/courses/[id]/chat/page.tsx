"use client";

// NovaLearn – Chat-Seite (Plan Abschnitt 7: app/courses/[id]/chat/page.tsx).

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuthUser } from "@/components/providers/AuthProvider";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { listChunks } from "@/lib/firestore/chunks";
import { listSources } from "@/lib/firestore/sources";
import { listPageImages } from "@/lib/firestore/pageImages";
import { getCourse } from "@/lib/firestore/courses";
import type { SearchableChunk } from "@/lib/rag/search";
import type { Course, CoursePageImage } from "@/types/course";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const { uid } = useAuthUser();

  const [course, setCourse] = useState<Course | null>(null);
  const [chunks, setChunks] = useState<SearchableChunk[] | null>(null);
  const [pageImages, setPageImages] = useState<CoursePageImage[]>([]);

  useEffect(() => {
    if (!uid) return;
    Promise.all([
      getCourse(courseId),
      listChunks(courseId),
      listSources(courseId),
      listPageImages(courseId),
    ]).then(([courseData, chunkData, sourceData, pageImageData]) => {
      setCourse(courseData);
      setPageImages(pageImageData);
      const fileNameBySourceId = new Map(sourceData.map((s) => [s.id, s.fileName]));
      setChunks(
        chunkData.map((c) => ({
          id: c.id,
          text: c.text,
          embedding: c.embedding,
          sourceId: c.sourceId,
          pageRef: c.pageRef,
          pageNumbers: c.pageNumbers,
          sourceFileName: fileNameBySourceId.get(c.sourceId) ?? "Unbekannte Quelle",
        })),
      );
    });
  }, [uid, courseId]);

  if (!course || !chunks) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <Link href={`/courses/${courseId}`} className="text-xs text-slate-400 hover:text-slate-600">
        ← {course.name}
      </Link>
      <h1 className="mt-1 text-xl font-semibold text-slate-900">Chat</h1>

      {chunks.length === 0 ? (
        <p className="mt-8 text-sm text-slate-400">
          Noch kein Material hochgeladen – im Dashboard PDFs hinzufügen, um chatten zu können.
        </p>
      ) : (
        <div className="mt-6">
          <ChatWindow courseId={courseId} chunks={chunks} pageImages={pageImages} />
        </div>
      )}
    </div>
  );
}
